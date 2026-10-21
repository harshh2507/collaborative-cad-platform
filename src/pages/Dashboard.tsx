import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ThreeDViewer from "../components/ThreeDViewer";
import {
  Box,
  Users,
  Plus,
  Move,
  RotateCw,
  Maximize,
  Undo2,
  Redo2,
  Pin,
  Upload,
  ChevronRight,
  Send,
  Settings,
  LayoutGrid,
  Ruler,
  Share2,
  FileDown,
  X,
  Mail,
  Clock,
  User as UserIcon,
  FolderPlus,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Table,
  MessageCircle,
  Folder,
  Shield,
  Sliders,
  LogOut,
  Save,
  Copy,
  Check,
  Globe,
  Lock,
  Link as LinkIcon,
  Search,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Radio,
  Trash2,
  CheckCircle2,
  Layers,
} from "lucide-react";

/* ============================== Types ============================== */

type View = "HUB" | "WORKBENCH";
type HubTab = "projects" | "team" | "account";

interface Project {
  id: string;
  name: string;
  date: string;
  collaborators: string[];
  fileType: string;
  role?: "Owner" | "Editor" | "Viewer";
}

interface ProjectCollaborator {
  email: string;
  role: "Editor" | "Viewer";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Viewer";
  joinedAt: string;
  status: "Online" | "In Workbench" | "Away";
  projectAccess?: string[];
}

interface PendingInvite {
  id: string;
  email: string;
  role: "Editor" | "Viewer";
  sentAt: string;
  projectName: string;
  projectId?: string;
}

interface Annotation {
  id: string;
  position: [number, number, number];
  text: string;
  user: string;
  resolved: boolean;
}

interface ChatMsg {
  id: string;
  user: string;
  text: string;
  time: string;
}

interface ModelProps {
  wireframe: boolean;
  scale: number;
  color: number;
  extraParts: number;
}

/* ============================== Helper ============================== */

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "ME";
}

/* ============================== Main Application ============================== */

export default function ProfessionalCADApp() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentView, setCurrentView] = useState<View>("HUB");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);

  // 3D Model State
  const [modelProps, setModelProps] = useState<ModelProps>({
    wireframe: false,
    scale: 1,
    color: 0x808080,
    extraParts: 0,
  });

  const currentUserName: string =
    (user as any)?.name || (user as any)?.username || "My Account (You)";
  const currentUserEmail: string = user?.email || "";
  const currentUserRole = ((user as any)?.role || "Owner") as "Owner" | "Editor" | "Viewer";

  // Persistent team members from localStorage
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const defaultMe: TeamMember = {
      id: "me",
      name: currentUserName,
      email: currentUserEmail,
      role: currentUserRole,
      joinedAt: new Date().toLocaleDateString(),
      status: "Online",
      projectAccess: ["All Assemblies"],
    };
    try {
      const saved = localStorage.getItem("cad_platform_team_members");
      if (saved) {
        const parsed: TeamMember[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (m) => m.id !== "me" && m.email.toLowerCase() !== currentUserEmail.toLowerCase()
        );
        return [defaultMe, ...filtered];
      }
    } catch {}
    return [defaultMe];
  });

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(() => {
    try {
      const saved = localStorage.getItem("cad_platform_pending_invites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{
    pos: [number, number, number];
    project: any;
  } | null>(null);
  const [errorText, setErrorText] = useState("");
  const [allAnnotations, setAllAnnotations] = useState<Annotation[]>([]);

  const showNotify = (
    message: string,
    type: "success" | "info" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync "me" credentials
  useEffect(() => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === "me"
          ? {
              ...m,
              name: currentUserName,
              email: currentUserEmail,
              role: currentUserRole,
            }
          : m
      )
    );
  }, [currentUserName, currentUserEmail, currentUserRole]);

  // Persist team members to localStorage
  useEffect(() => {
    const toSave = teamMembers.filter((m) => m.id !== "me");
    localStorage.setItem("cad_platform_team_members", JSON.stringify(toSave));
  }, [teamMembers]);

  // Auto-reconciliation: If a user is already active in teamMembers, purge them from pendingInvites
  useEffect(() => {
    setPendingInvites((prev) => {
      const activeEmails = new Set(teamMembers.map((m) => m.email.toLowerCase()));
      const filtered = prev.filter((inv) => !activeEmails.has(inv.email.toLowerCase()));
      if (filtered.length !== prev.length) {
        localStorage.setItem("cad_platform_pending_invites", JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });
  }, [teamMembers]);

  // Cross-tab storage synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cad_platform_pending_invites" && e.newValue) {
        try {
          setPendingInvites(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === "cad_platform_team_members" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTeamMembers((prev) => {
            const me = prev.find((m) => m.id === "me") || prev[0];
            const others = parsed.filter(
              (m: any) => m.email?.toLowerCase() !== currentUserEmail.toLowerCase()
            );
            return [me, ...others];
          });
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [currentUserEmail]);

  // Real-time BroadcastChannel synchronization
  useEffect(() => {
    const channel = new BroadcastChannel("cad_platform_team_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "COLLABORATOR_JOINED") {
        const newCollaborator = event.data.user;
        const assignedRole = event.data.access === "viewer" ? "Viewer" : "Editor";
        const emailLower = (newCollaborator.email || "").toLowerCase();

        setTeamMembers((prev) => {
          if (prev.some((m) => m.email.toLowerCase() === emailLower)) {
            return prev.map((m) =>
              m.email.toLowerCase() === emailLower ? { ...m, status: "In Workbench" } : m
            );
          }
          return [
            ...prev,
            {
              id: String(Date.now()),
              name: newCollaborator.name || emailLower.split("@")[0],
              email: newCollaborator.email,
              role: assignedRole,
              joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "In Workbench",
              projectAccess: [event.data.projectName || selectedProject?.name || "Active Project"],
            },
          ];
        });

        // Automatically purge from pending invitations
        setPendingInvites((prev) => {
          const updated = prev.filter((inv) => inv.email.toLowerCase() !== emailLower);
          localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
          return updated;
        });

        showNotify(`${newCollaborator.name || newCollaborator.email} entered the workspace!`, "success");
      }

      if (event.data?.type === "PROJECT_PERMISSIONS_SYNC") {
        if (selectedProject && selectedProject.id === event.data.projectId) {
          showNotify(`Project sharing permissions updated by ${event.data.updatedBy}.`, "info");
        }
      }

      if (event.data?.type === "NEW_ANNOTATION") {
        if (event.data.projectId === selectedProject?.id) {
          setAllAnnotations((prev) => {
            if (prev.some((a) => a.id === event.data.annotation.id)) return prev;
            return [...prev, event.data.annotation];
          });
          showNotify(`New issue flagged by ${event.data.annotation.user}: "${event.data.annotation.text}"`, "info");
        }
      }

      if (event.data?.type === "RESOLVE_ANNOTATION") {
        setAllAnnotations((prev) => prev.filter((a) => a.id !== String(event.data.annotationId)));
      }
    };

    return () => {
      channel.close();
    };
  }, [selectedProject]);

  // Load projects from backend
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsApi.list();
        const backendProjects = Array.isArray(response)
          ? response
          : ((response as any)?.projects ?? []);

        const formattedProjects: Project[] = backendProjects.map((p: any) => ({
          id: String(p.project_id ?? p.id),
          name: p.project_name ?? p.name ?? "Untitled Project",
          date: p.created_at
            ? new Date(p.created_at).toLocaleDateString()
            : "Recently created",
          collaborators: [currentUserName],
          fileType: "CAD",
          role: (p.role || "Editor").toLowerCase() === "viewer" ? "Viewer" : "Editor",
        }));

        if (formattedProjects.length > 0) {
          setProjects(formattedProjects);
        }
      } catch (error) {
        console.warn("Failed to load projects from backend, using current state:", error);
      }
    };

    if (user) {
      loadProjects();
    }
  }, [user, currentUserName]);

  // Handle Invitation Link & direct access routing
  useEffect(() => {
    const rawSavedInvite = sessionStorage.getItem("pending_cad_invite");
    const currentProjectId = searchParams.get("projectId");

    let inviteData: Record<string, string> | null = null;

    if (currentProjectId) {
      inviteData = {
        projectId: searchParams.get("projectId") || "",
        projectName: searchParams.get("projectName") || "",
        inviter: searchParams.get("from") || "Teammate",
        inviterEmail: searchParams.get("fromEmail") || "",
        scope: searchParams.get("scope") || "restricted",
        access: searchParams.get("access") || "editor",
        authorizedEmail: searchParams.get("for") || "",
      };
      sessionStorage.setItem("pending_cad_invite", JSON.stringify(inviteData));
    } else if (rawSavedInvite) {
      try {
        inviteData = JSON.parse(rawSavedInvite);
      } catch {
        inviteData = null;
      }
    }

    if (!inviteData || !inviteData.projectId) return;

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const { projectId, projectName, inviter, inviterEmail, scope, access, authorizedEmail } = inviteData;
    const cleanUserEmail = currentUserEmail.trim().toLowerCase();
    const cleanInviterEmail = (inviterEmail || "").trim().toLowerCase();
    const isOwner = cleanUserEmail && cleanUserEmail === cleanInviterEmail;

    const executeJoin = (assignedRole: "Editor" | "Viewer") => {
      const projDisplayName = projectName ? decodeURIComponent(projectName) : "Collaborative Assembly";
      const sharedProject: Project = {
        id: projectId,
        name: projDisplayName,
        date: `Shared by ${inviter}`,
        collaborators: [inviter, currentUserName],
        fileType: "CAD",
        role: assignedRole,
      };

      setProjects((prev) => {
        if (prev.some((p) => p.id === sharedProject.id)) return prev;
        return [sharedProject, ...prev];
      });

      setSelectedProject(sharedProject);
      setCurrentView("WORKBENCH");
      sessionStorage.removeItem("pending_cad_invite");

      // Clean up from pending invites in localStorage
      try {
        const saved = localStorage.getItem("cad_platform_pending_invites");
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.filter(
            (inv: any) => inv.email.toLowerCase() !== cleanUserEmail
          );
          localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
          setPendingInvites(updated);
        }
      } catch (err) {
        console.warn(err);
      }

      // Add to team members in localStorage
      try {
        const teamSaved = localStorage.getItem("cad_platform_team_members");
        const currentList = teamSaved ? JSON.parse(teamSaved) : [];
        if (!currentList.some((m: any) => m.email.toLowerCase() === cleanUserEmail)) {
          currentList.push({
            id: String(Date.now()),
            name: currentUserName,
            email: currentUserEmail,
            role: assignedRole,
            joinedAt: new Date().toLocaleDateString(),
            status: "In Workbench",
            projectAccess: [projDisplayName],
          });
          localStorage.setItem("cad_platform_team_members", JSON.stringify(currentList));
        }
      } catch (err) {
        console.warn(err);
      }

      // Broadcast across tabs (WITHOUT synchronous channel.close())
      const channel = new BroadcastChannel("cad_platform_team_sync");
      channel.postMessage({
        type: "COLLABORATOR_JOINED",
        access: assignedRole.toLowerCase(),
        user: { name: currentUserName, email: currentUserEmail },
        projectId: projectId,
        projectName: projDisplayName,
      });

      // Allow background queue to dispatch before closing
      setTimeout(() => {
        channel.close();
      }, 1000);

      showNotify(`Joined ${inviter}'s project "${sharedProject.name}" as ${assignedRole}!`, "success");
    };

    if (scope === "anyone") {
      executeJoin(access.toLowerCase() === "viewer" ? "Viewer" : "Editor");
      return;
    }

    if (isOwner) {
      executeJoin("Editor");
      return;
    }

    if (authorizedEmail && authorizedEmail.toLowerCase() === cleanUserEmail) {
      executeJoin(access.toLowerCase() === "viewer" ? "Viewer" : "Editor");
      return;
    }

    const token = localStorage.getItem("cad_platform_token");
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    fetch(`${backendUrl}/projects/${projectId}/collaborators`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.collaborators || [];
        const match = list.find(
          (c: any) => (c.email || c.user_email || "").toLowerCase() === cleanUserEmail
        );

        if (match) {
          executeJoin(match.role?.toLowerCase() === "viewer" ? "Viewer" : "Editor");
        } else {
          executeJoin("Editor");
        }
      })
      .catch(() => {
        executeJoin(access.toLowerCase() === "viewer" ? "Viewer" : "Editor");
      });
  }, [searchParams, user, currentUserEmail, currentUserName, navigate]);

  const handleImport = async (projectName: string, description: string) => {
    if (!projectName.trim()) return;

    try {
      const token = localStorage.getItem("cad_platform_token");
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${backendUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          project_name: projectName.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create project");

      const p = data.project || data;
      const newProject: Project = {
        id: String(p.project_id ?? p.id ?? Date.now()),
        name: p.project_name ?? projectName.trim(),
        date: new Date().toLocaleDateString(),
        collaborators: [currentUserName],
        fileType: "CAD",
        role: "Owner",
      };

      setProjects((current) => [newProject, ...current]);
      setSelectedProject(newProject);
      setIsImportModalOpen(false);
      setCurrentView("WORKBENCH");
      showNotify(`Project "${newProject.name}" created successfully!`);
    } catch (error) {
      console.warn("Backend project creation skipped, creating locally:", error);
      const fallbackProject: Project = {
        id: String(Date.now()),
        name: projectName.trim(),
        date: new Date().toLocaleDateString(),
        collaborators: [currentUserName],
        fileType: "CAD",
        role: "Owner",
      };

      setProjects((current) => [fallbackProject, ...current]);
      setSelectedProject(fallbackProject);
      setIsImportModalOpen(false);
      setCurrentView("WORKBENCH");
      showNotify(`Project "${fallbackProject.name}" created!`, "success");
    }
  };

  const handleSaveAnnotation = () => {
    if (!errorText.trim()) return;
    const newAnn: Annotation = {
      id: Date.now().toString(),
      position: pendingAnnotation?.pos || [0, 0, 0],
      text: errorText.trim(),
      user: currentUserName,
      resolved: false,
    };

    setAllAnnotations((prev) => [...prev, newAnn]);
    setIsErrorModalOpen(false);
    setErrorText("");
    setPendingAnnotation(null);
    showNotify("Error pinned to model");

    const channel = new BroadcastChannel("cad_platform_team_sync");
    channel.postMessage({
      type: "NEW_ANNOTATION",
      projectId: selectedProject?.id,
      annotation: newAnn,
    });
    setTimeout(() => channel.close(), 1000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <style>{CSS}</style>

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="toast-content">{notification.message}</div>
        </div>
      )}

      {isErrorModalOpen && (
        <div className="modal-overlay-blur">
          <div className="error-input-modal">
            <div className="modal-header">
              <h3>Flag Model Error / Issue</h3>
              <X
                className="close-icon"
                onClick={() => setIsErrorModalOpen(false)}
                size={16}
              />
            </div>
            <div className="modal-body">
              <label>Describe the issue in detail:</label>
              <textarea
                autoFocus
                placeholder="e.g. Clearance between bracket and housing is too tight..."
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsErrorModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveAnnotation}
                disabled={!errorText.trim()}
              >
                Save Pin
              </button>
            </div>
          </div>
        </div>
      )}

      {sharingProject && (
        <ProjectShareModal
          project={sharingProject}
          currentUserName={currentUserName}
          currentUserEmail={currentUserEmail}
          onClose={() => setSharingProject(null)}
          onNotify={showNotify}
          onInviteCreated={(invite) => {
            setPendingInvites((prev) => {
              const updated = [invite, ...prev.filter((i) => i.email !== invite.email)];
              localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
              return updated;
            });
          }}
        />
      )}

      {currentView === "HUB" || !selectedProject ? (
        <ProjectHub
          projects={projects}
          teamMembers={teamMembers}
          setTeamMembers={setTeamMembers}
          pendingInvites={pendingInvites}
          setPendingInvites={setPendingInvites}
          currentUserName={currentUserName}
          currentUserEmail={currentUserEmail}
          currentUserRole={currentUserRole}
          onUpdateUser={updateUser}
          onLogout={handleLogout}
          showNotify={showNotify}
          onOpenProject={(p: Project) => {
            setSelectedProject(p);
            setCurrentView("WORKBENCH");
          }}
          onImportClick={() => setIsImportModalOpen(true)}
          onShareProject={(p: Project) => setSharingProject(p)}
        />
      ) : (
        <Workbench
          project={selectedProject}
          currentUserName={currentUserName}
          onBack={() => setCurrentView("HUB")}
          notify={showNotify}
          annotations={allAnnotations}
          setAnnotations={setAllAnnotations}
          openErrorModal={(pos: [number, number, number]) => {
            setPendingAnnotation({ pos, project: selectedProject });
            setIsErrorModalOpen(true);
          }}
          onShareProject={() => setSharingProject(selectedProject)}
          modelProps={modelProps}
          setModelProps={setModelProps}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onConfirm={handleImport}
        />
      )}
    </div>
  );
}

/* ============================== Professional Team Hub Component ============================== */

interface ProjectHubProps {
  projects: Project[];
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  pendingInvites: PendingInvite[];
  setPendingInvites: React.Dispatch<React.SetStateAction<PendingInvite[]>>;
  currentUserName: string;
  currentUserEmail: string;
  currentUserRole: string;
  onUpdateUser: (u: any) => void;
  onLogout: () => void;
  showNotify: (msg: string, type?: "success" | "info") => void;
  onOpenProject: (p: Project) => void;
  onImportClick: () => void;
  onShareProject: (p: Project) => void;
}

function ProjectHub({
  projects,
  teamMembers,
  setTeamMembers,
  pendingInvites,
  setPendingInvites,
  currentUserName,
  currentUserEmail,
  currentUserRole,
  onUpdateUser,
  onLogout,
  showNotify,
  onOpenProject,
  onImportClick,
  onShareProject,
}: ProjectHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("projects");
  const [teamSubTab, setTeamSubTab] = useState<"members" | "pending" | "matrix">("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Editor" | "Viewer">("Editor");
  const [inviteTargetProject, setInviteTargetProject] = useState(projects[0]?.id || "");

  // Profile fields
  const [editName, setEditName] = useState(currentUserName);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [unitPreference, setUnitPreference] = useState("Millimeters (mm)");
  const [shadingPreference, setShadingPreference] = useState("Standard Shaded");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    setEditName(currentUserName);
  }, [currentUserName]);

  useEffect(() => {
    if (projects.length > 0 && !inviteTargetProject) {
      setInviteTargetProject(projects[0].id);
    }
  }, [projects, inviteTargetProject]);

  const initials = getInitials(currentUserName, currentUserEmail);

  // Filtered active team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "ALL" || m.role.toUpperCase() === roleFilter.toUpperCase();
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, roleFilter]);

  const handleDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      showNotify("Please provide a valid email address.", "info");
      return;
    }

    const targetProj = projects.find((p) => p.id === inviteTargetProject) || projects[0];
    const projName = targetProj ? targetProj.name : "Engineering Assembly";

    if (targetProj) {
      try {
        const token = localStorage.getItem("cad_platform_token");
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        await fetch(`${backendUrl}/projects/${targetProj.id}/collaborators`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email: cleanEmail, role: inviteRole }),
        });
      } catch (err) {
        console.warn("Backend collaborator sync skipped:", err);
      }
    }

    const newInvite: PendingInvite = {
      id: String(Date.now()),
      email: cleanEmail,
      role: inviteRole,
      sentAt: new Date().toLocaleDateString(),
      projectName: projName,
      projectId: targetProj?.id || "1",
    };

    setPendingInvites((prev) => {
      const updated = [newInvite, ...prev.filter((i) => i.email !== cleanEmail)];
      localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
      return updated;
    });

    const inviteLink = `${window.location.origin}/invite?from=${encodeURIComponent(
      currentUserName
    )}&fromEmail=${encodeURIComponent(currentUserEmail)}&projectId=${
      targetProj?.id || "1"
    }&projectName=${encodeURIComponent(projName)}&scope=restricted&access=${inviteRole.toLowerCase()}&for=${encodeURIComponent(cleanEmail)}`;

    navigator.clipboard.writeText(inviteLink);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    showNotify(`Invitation created for ${cleanEmail}! Invite link copied.`, "success");
  };

  const handleRevokeInvite = (email: string) => {
    setPendingInvites((prev) => {
      const updated = prev.filter((i) => i.email !== email);
      localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
      return updated;
    });
    showNotify(`Revoked invitation for ${email}.`, "info");
  };

  // Quick Action: Manually mark collaborator as joined (moving from pending to active)
  const handleMarkAsJoined = (inv: PendingInvite) => {
    // 1. Remove from pending
    setPendingInvites((prev) => {
      const updated = prev.filter((i) => i.email.toLowerCase() !== inv.email.toLowerCase());
      localStorage.setItem("cad_platform_pending_invites", JSON.stringify(updated));
      return updated;
    });

    // 2. Add to active team
    setTeamMembers((prev) => {
      if (prev.some((m) => m.email.toLowerCase() === inv.email.toLowerCase())) return prev;
      const updated = [
        ...prev,
        {
          id: String(Date.now()),
          name: inv.email.split("@")[0],
          email: inv.email,
          role: inv.role,
          joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "In Workbench" as const,
          projectAccess: [inv.projectName],
        },
      ];
      localStorage.setItem(
        "cad_platform_team_members",
        JSON.stringify(updated.filter((m) => m.id !== "me"))
      );
      return updated;
    });

    showNotify(`${inv.email} confirmed as active workspace collaborator!`, "success");
  };

  return (
    <div className="hub-view">
      <nav className="hub-nav">
        <div className="logo">
          <Box className="logo-icon" size={20} />
          <span>Workbench CAD</span>
        </div>
        <div className="nav-links">
          <div
            className={`nav-item ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <LayoutGrid size={16} /> Projects
          </div>
          <div
            className={`nav-item ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            <Users size={16} /> Team
            {pendingInvites.length > 0 && (
              <span className="badge-notification">{pendingInvites.length}</span>
            )}
          </div>
          <div
            className={`nav-item ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <Settings size={16} /> Account
          </div>
        </div>

        <div className="user-profile">
          <div
            className="avatar user-initials-avatar"
            title={`${currentUserName} (${currentUserEmail})`}
            onClick={() => setActiveTab("account")}
            style={{ cursor: "pointer" }}
          >
            {initials}
          </div>
        </div>
      </nav>

      <main className="hub-content">
        {/* ===================== PROJECTS TAB ===================== */}
        {activeTab === "projects" && (
          <>
            <header className="hub-header">
              <div>
                <h1>Design Workspace</h1>
                <p>Collaborate on high-precision CAD assemblies in real-time.</p>
              </div>
              <button className="btn-primary" onClick={onImportClick}>
                <Plus size={16} /> Start New Project
              </button>
            </header>

            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Upload size={56} strokeWidth={1} />
                </div>
                <h2>No projects found</h2>
                <p>
                  You haven't uploaded any models yet. Start a new assembly to begin collaborating.
                </p>
                <button className="btn-primary" onClick={onImportClick} style={{ padding: "10px 24px" }}>
                  Import CAD Model
                </button>
              </div>
            ) : (
              <div className="project-grid">
                {projects.map((p: Project) => (
                  <div key={p.id} className="project-card" onClick={() => onOpenProject(p)}>
                    <div className="card-thumb">
                      <div className="thumb-label">{p.fileType}</div>
                      <button
                        className="card-share-btn"
                        title="Share project"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareProject(p);
                        }}
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                    <div className="card-info">
                      <h3>{p.name}</h3>
                      <p>Created {p.date}</p>
                    </div>
                    <ChevronRight className="card-arrow" size={16} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===================== TEAM TAB ===================== */}
        {activeTab === "team" && (
          <div className="tab-section team-enhanced-section">
            <header className="hub-header team-hub-header">
              <div>
                <h1>Engineering Team & Access Control</h1>
                <p>Manage workspace collaborators, inspect access privileges, and track live CAD sessions.</p>
              </div>
              <button className="btn-primary" onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus size={16} /> Invite Teammate
              </button>
            </header>

            {/* KPI Cards */}
            <div className="team-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper cyan">
                  <Users size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Active Members</span>
                  <span className="stat-number">{teamMembers.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper green">
                  <Radio size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Online In Viewport</span>
                  <span className="stat-number">
                    {teamMembers.filter((m) => m.status !== "Away").length}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper orange">
                  <Clock size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Pending Invitations</span>
                  <span className="stat-number">{pendingInvites.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper purple">
                  <ShieldCheck size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Security Protocol</span>
                  <span className="stat-number" style={{ fontSize: "14px", letterSpacing: "0.2px" }}>
                    Role-Based Access
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs & Filter Bar */}
            <div className="team-subtabs-toolbar">
              <div className="team-subtabs">
                <button
                  className={`team-subtab-btn ${teamSubTab === "members" ? "active" : ""}`}
                  onClick={() => setTeamSubTab("members")}
                >
                  <UserCheck size={15} /> Active Engineers ({teamMembers.length})
                </button>
                <button
                  className={`team-subtab-btn ${teamSubTab === "pending" ? "active" : ""}`}
                  onClick={() => setTeamSubTab("pending")}
                >
                  <Clock size={15} /> Pending Invites ({pendingInvites.length})
                </button>
                <button
                  className={`team-subtab-btn ${teamSubTab === "matrix" ? "active" : ""}`}
                  onClick={() => setTeamSubTab("matrix")}
                >
                  <Shield size={15} /> CAD Permission Matrix
                </button>
              </div>

              {teamSubTab === "members" && (
                <div className="team-filters">
                  <div className="team-search-input">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search member or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <X size={13} className="clear-search" onClick={() => setSearchQuery("")} />
                    )}
                  </div>

                  <select
                    className="share-select team-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="OWNER">Owners</option>
                    <option value="EDITOR">CAD Editors</option>
                    <option value="VIEWER">Viewers</option>
                  </select>
                </div>
              )}
            </div>

            {/* Sub-Tab 1: Active Collaborators */}
            {teamSubTab === "members" && (
              <div className="team-table-container">
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Collaborator</th>
                      <th>Email Address</th>
                      <th>Workspace Role</th>
                      <th>Assigned CAD Models</th>
                      <th>Last Seen / Joined</th>
                      <th>Session Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member: TeamMember) => (
                      <tr key={member.id}>
                        <td className="user-cell">
                          <div className="avatar-wrapper">
                            <div className="avatar small">
                              {getInitials(member.name, member.email)}
                            </div>
                            <span className={`status-dot-badge ${member.status.toLowerCase().replace(/\s/g, "-")}`} />
                          </div>
                          <div>
                            <span className="member-name-text">
                              {member.name} {member.id === "me" && <span className="you-pill">You</span>}
                            </span>
                          </div>
                        </td>
                        <td className="dim-text">
                          <Mail size={13} style={{ display: "inline", marginRight: 6, opacity: 0.6 }} />
                          {member.email}
                        </td>
                        <td>
                          <span className={`role-badge ${member.role.toLowerCase()}`}>
                            {member.role === "Owner"
                              ? "Workspace Owner"
                              : member.role === "Editor"
                              ? "CAD Engineer (Editor)"
                              : "Reviewer (Viewer)"}
                          </span>
                        </td>
                        <td>
                          <span className="project-access-tag">
                            {member.projectAccess?.length ? member.projectAccess.join(", ") : "All Active Models"}
                          </span>
                        </td>
                        <td className="dim-text">
                          <Clock size={13} style={{ display: "inline", marginRight: 6, opacity: 0.6 }} />
                          {member.joinedAt}
                        </td>
                        <td>
                          <span className={`status-pill ${member.status.toLowerCase().replace(/\s/g, "-")}`}>
                            <span className="dot"></span>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                          No team members match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-Tab 2: Pending Invitations */}
            {teamSubTab === "pending" && (
              <div className="team-table-container">
                {pendingInvites.length === 0 ? (
                  <div className="empty-subtab-state">
                    <Clock size={36} color="#666" />
                    <h3>No Pending Invitations</h3>
                    <p>All invited team members have joined and are active in the workspace.</p>
                    <button className="btn-secondary" onClick={() => setIsInviteModalOpen(true)}>
                      <UserPlus size={14} /> Send an Invite
                    </button>
                  </div>
                ) : (
                  <table className="team-table">
                    <thead>
                      <tr>
                        <th>Invited Email</th>
                        <th>Granted Role</th>
                        <th>Target Model Assembly</th>
                        <th>Sent Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvites.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar small" style={{ borderStyle: "dashed" }}>
                                {getInitials(inv.email, inv.email)}
                              </div>
                              <span style={{ color: "#fff", fontWeight: 500 }}>{inv.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${inv.role.toLowerCase()}`}>
                              {inv.role}
                            </span>
                          </td>
                          <td style={{ color: "var(--accent-cyan)" }}>
                            <Box size={13} style={{ display: "inline", marginRight: 6 }} />
                            {inv.projectName}
                          </td>
                          <td className="dim-text">{inv.sentAt}</td>
                          <td>
                            <span className="status-pill away">
                              <span className="dot"></span> Awaiting First Login
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <button
                                className="btn-copy-small"
                                style={{ background: "rgba(92,190,126,0.15)", borderColor: "var(--success)", color: "var(--success)" }}
                                title="Confirm Joined"
                                onClick={() => handleMarkAsJoined(inv)}
                              >
                                <Check size={12} /> Confirm Joined
                              </button>
                              <button
                                className="btn-copy-small"
                                title="Copy link again"
                                onClick={() => {
                                  const link = `${window.location.origin}/invite?from=${encodeURIComponent(
                                    currentUserName
                                  )}&fromEmail=${encodeURIComponent(
                                    currentUserEmail
                                  )}&projectId=${inv.projectId || "1"}&projectName=${encodeURIComponent(
                                    inv.projectName
                                  )}&scope=restricted&access=${inv.role.toLowerCase()}&for=${encodeURIComponent(
                                    inv.email
                                  )}`;
                                  navigator.clipboard.writeText(link);
                                  showNotify(`Invite link copied for ${inv.email}!`, "success");
                                }}
                              >
                                <Copy size={12} /> Copy Link
                              </button>
                              <button
                                className="btn-remove-user"
                                title="Revoke Invitation"
                                onClick={() => handleRevokeInvite(inv.email)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Sub-Tab 3: CAD Permission Matrix */}
            {teamSubTab === "matrix" && (
              <div className="matrix-card">
                <div className="matrix-header">
                  <h3>CAD Workspace Role Capabilities</h3>
                  <p>Fine-grained permissions governing 3D model modifications, annotations, and sharing.</p>
                </div>
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Capability / Permission</th>
                      <th>Owner</th>
                      <th>CAD Engineer (Editor)</th>
                      <th>Reviewer (Viewer)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Inspect 3D Assembly & Rotate Viewport</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                    </tr>
                    <tr>
                      <td>Pin Annotations & Flag Model Errors</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                    </tr>
                    <tr>
                      <td>Transform Objects (Move, Rotate, Scale)</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><span className="denied-dash">—</span></td>
                    </tr>
                    <tr>
                      <td>Upload STEP Models & New Primitives</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><span className="denied-dash">—</span></td>
                    </tr>
                    <tr>
                      <td>Export STEP & BOM Excel Reports</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><span className="denied-dash">—</span></td>
                    </tr>
                    <tr>
                      <td>Manage Team Seats & Project Share Links</td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><CheckCircle2 size={16} color="var(--success)" /></td>
                      <td><span className="denied-dash">—</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Invite Modal */}
            {isInviteModalOpen && (
              <div className="modal-overlay-blur">
                <div className="modal-card">
                  <div className="modal-header">
                    <div className="share-header-title">
                      <UserPlus size={16} color="var(--accent-cyan)" />
                      <h3>Invite Engineer to Workspace</h3>
                    </div>
                    <X className="close-icon" onClick={() => setIsInviteModalOpen(false)} size={16} />
                  </div>
                  <form onSubmit={handleDirectInvite}>
                    <div className="modal-body">
                      <label>Teammate Email Address</label>
                      <input
                        className="project-input"
                        type="email"
                        placeholder="e.g. sana@gmail.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        autoFocus
                        required
                      />

                      <label>CAD Workspace Permission Role</label>
                      <select
                        className="share-select"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                      >
                        <option value="Editor">CAD Engineer / Editor (Can modify geometry & annotate)</option>
                        <option value="Viewer">Reviewer / Viewer (Can only inspect & view pins)</option>
                      </select>

                      {projects.length > 0 && (
                        <>
                          <label>Initial Project Assignment</label>
                          <select
                            className="share-select"
                            value={inviteTargetProject}
                            onChange={(e) => setInviteTargetProject(e.target.value)}
                          >
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      <p className="project-hint">
                        An invite link with pre-authorized access will be copied automatically to your clipboard.
                      </p>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsInviteModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={!inviteEmail.trim()}
                      >
                        Generate & Copy Invite
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ACCOUNT TAB ===================== */}
        {activeTab === "account" && (
          <div className="tab-section account-section">
            <header className="account-header">
              <h1>Account Settings</h1>
              <p>Manage your login details, security, and workspace preferences.</p>
            </header>

            <div className="account-layout">
              <div className="account-card-new">
                <div className="account-card-header">
                  <UserIcon size={20} color="rgba(64,232,244,1)" />
                  <h3>Profile Details</h3>
                </div>
                <div className="account-card-body">
                  <div className="profile-identity-banner">
                    <div className="avatar-large">{initials}</div>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", color: "#fff" }}>
                        {currentUserName}
                      </h4>
                      <span className="role-badge owner">{currentUserRole}</span>
                    </div>
                  </div>

                  <div className="account-field-row">
                    <label>Full Name / Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="account-field-row">
                    <label>Email Address</label>
                    <input type="text" value={currentUserEmail} readOnly />
                  </div>

                  <div className="account-field-row">
                    <label>Account Role</label>
                    <input type="text" value={currentUserRole} readOnly />
                  </div>

                  <button
                    className="btn-primary"
                    style={{ alignSelf: "flex-start", marginTop: "10px" }}
                    onClick={async () => {
                      onUpdateUser({ name: editName });
                      showNotify("Profile updated!", "success");
                    }}
                  >
                    <Save size={15} /> Save Profile Changes
                  </button>
                </div>
              </div>

              <div className="account-card-new">
                <div className="account-card-header">
                  <Shield size={20} color="rgba(64,232,244,1)" />
                  <h3>Security & Password</h3>
                </div>
                <div className="account-card-body">
                  <div className="account-field-row">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                    />
                  </div>
                  <div className="account-field-row">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="account-field-row">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ alignSelf: "flex-start", marginTop: "10px" }}
                    onClick={async () => {
                      if (!currPassword) return showNotify("Enter current password.", "info");
                      if (newPassword.length < 8) return showNotify("Password must be 8+ characters.", "info");
                      if (newPassword !== confirmNewPassword) return showNotify("Passwords don't match.", "info");
                      try {
                        await authApi.changePassword({ currentPassword: currPassword, newPassword });
                        setCurrPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        showNotify("Password updated successfully!", "success");
                      } catch (err: any) {
                        showNotify(err?.message || "Failed to update password.", "info");
                      }
                    }}
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <div className="account-card-new">
                <div className="account-card-header">
                  <Sliders size={20} color="rgba(64,232,244,1)" />
                  <h3>CAD Preferences</h3>
                </div>
                <div className="account-card-body">
                  <div className="account-field-row">
                    <label>Default Measurement Units</label>
                    <select
                      className="account-select"
                      value={unitPreference}
                      onChange={(e) => setUnitPreference(e.target.value)}
                    >
                      <option>Millimeters (mm)</option>
                      <option>Centimeters (cm)</option>
                      <option>Meters (m)</option>
                      <option>Inches (in)</option>
                    </select>
                  </div>

                  <div className="account-field-row">
                    <label>Default Viewport Shading</label>
                    <select
                      className="account-select"
                      value={shadingPreference}
                      onChange={(e) => setShadingPreference(e.target.value)}
                    >
                      <option>Standard Shaded</option>
                      <option>Wireframe Mode</option>
                      <option>High-Precision Render</option>
                    </select>
                  </div>

                  <div className="preference-toggle-row">
                    <div>
                      <span style={{ color: "#fff", display: "block" }}>
                        Collaboration Notifications
                      </span>
                      <span style={{ color: "#888", fontSize: "12px" }}>
                        Receive email alerts when teammates leave model pins.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                    />
                  </div>
                </div>
              </div>

              <div className="account-card-new" style={{ borderColor: "rgba(226, 88, 74, 0.4)" }}>
                <div className="account-card-header">
                  <LogOut size={20} color="#e2584a" />
                  <h3 style={{ color: "#e2584a" }}>Session & Danger Zone</h3>
                </div>
                <div className="account-card-body">
                  <p style={{ color: "#aaa", margin: 0 }}>
                    Sign out of your active session on this CAD workstation.
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={onLogout}
                    style={{
                      alignSelf: "flex-start",
                      background: "rgba(226, 88, 74, 0.15)",
                      borderColor: "rgba(226, 88, 74, 0.4)",
                      color: "#ff8b80",
                    }}
                  >
                    <LogOut size={16} /> Sign Out of Workbench
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================== Share Modal ============================== */

function ProjectShareModal({
  project,
  currentUserName,
  currentUserEmail,
  onClose,
  onNotify,
  onInviteCreated,
}: {
  project: Project;
  currentUserName: string;
  currentUserEmail: string;
  onClose: () => void;
  onNotify: (msg: string, type?: "success" | "info") => void;
  onInviteCreated?: (invite: PendingInvite) => void;
}) {
  const storageKeyUsers = `cad_project_${project.id}_collaborators`;
  const storageKeyScope = `cad_project_${project.id}_scope`;
  const storageKeyGeneralRole = `cad_project_${project.id}_general_role`;

  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyUsers);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [accessScope, setAccessScope] = useState<"restricted" | "anyone">(() => {
    return (localStorage.getItem(storageKeyScope) as any) || "restricted";
  });

  const [generalRole, setGeneralRole] = useState<"Editor" | "Viewer">(() => {
    return (localStorage.getItem(storageKeyGeneralRole) as any) || "Editor";
  });

  const [newEmail, setNewEmail] = useState("");
  const [newEmailRole, setNewEmailRole] = useState<"Editor" | "Viewer">("Editor");
  const [copied, setCopied] = useState(false);

  const syncCollaboratorToBackend = async (email: string, role: string) => {
    try {
      const token = localStorage.getItem("cad_platform_token");
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${backendUrl}/projects/${project.id}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, role }),
      });
    } catch (err) {
      console.warn("Collaborator backend sync skipped:", err);
    }
  };

  const persistAndBroadcast = (
    updatedUsers: ProjectCollaborator[],
    updatedScope = accessScope,
    updatedGenRole = generalRole
  ) => {
    setCollaborators(updatedUsers);
    localStorage.setItem(storageKeyUsers, JSON.stringify(updatedUsers));
    localStorage.setItem(storageKeyScope, updatedScope);
    localStorage.setItem(storageKeyGeneralRole, updatedGenRole);

    const channel = new BroadcastChannel("cad_platform_team_sync");
    channel.postMessage({
      type: "PROJECT_PERMISSIONS_SYNC",
      projectId: project.id,
      collaborators: updatedUsers,
      scope: updatedScope,
      generalRole: updatedGenRole,
      updatedBy: currentUserName,
    });
    setTimeout(() => channel.close(), 1000);
  };

  const handleAddCollaborator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      onNotify("Please enter a valid email address.", "info");
      return;
    }

    if (cleanEmail === currentUserEmail.toLowerCase()) {
      onNotify("You are already the owner of this project.", "info");
      return;
    }

    const updated = [...collaborators.filter((c) => c.email !== cleanEmail), { email: cleanEmail, role: newEmailRole }];
    persistAndBroadcast(updated);
    syncCollaboratorToBackend(cleanEmail, newEmailRole);

    if (onInviteCreated) {
      onInviteCreated({
        id: String(Date.now()),
        email: cleanEmail,
        role: newEmailRole,
        sentAt: new Date().toLocaleDateString(),
        projectName: project.name,
        projectId: project.id,
      });
    }

    setNewEmail("");
    onNotify(`Added ${cleanEmail} as ${newEmailRole}!`, "success");
  };

  const handleRoleChange = (email: string, role: "Editor" | "Viewer") => {
    const updated = collaborators.map((c) =>
      c.email === email ? { ...c, role } : c
    );
    persistAndBroadcast(updated);
    syncCollaboratorToBackend(email, role);
    onNotify(`Updated ${email} to ${role}.`, "success");
  };

  const handleRemoveCollaborator = (email: string) => {
    const updated = collaborators.filter((c) => c.email !== email);
    persistAndBroadcast(updated);
    onNotify(`Removed access for ${email}.`, "info");
  };

  const baseUrl = window.location.origin;
  const inviterName = encodeURIComponent(currentUserName);
  const inviterEmail = encodeURIComponent(currentUserEmail);
  const projName = encodeURIComponent(project.name);

  const generatedInviteLink =
    accessScope === "restricted"
      ? `${baseUrl}/invite?from=${inviterName}&fromEmail=${inviterEmail}&projectId=${project.id}&projectName=${projName}&scope=restricted&access=editor`
      : `${baseUrl}/invite?from=${inviterName}&fromEmail=${inviterEmail}&projectId=${project.id}&projectName=${projName}&scope=anyone&access=${generalRole.toLowerCase()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    onNotify("Invite link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay-blur">
      <div className="share-modal-card">
        <div className="modal-header">
          <div className="share-header-title">
            <Share2 size={16} color="rgba(64,232,244,1)" />
            <h3>Share "{project.name}"</h3>
          </div>
          <X className="close-icon" onClick={onClose} size={16} />
        </div>

        <div className="modal-body share-modal-body">
          <form className="add-people-form" onSubmit={handleAddCollaborator}>
            <div className="add-people-input-row">
              <Mail size={16} className="add-mail-icon" />
              <input
                type="email"
                className="add-people-input"
                placeholder="Add people by email (e.g. sana@gmail.com)..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <select
                className="share-select add-role-select"
                value={newEmailRole}
                onChange={(e) => setNewEmailRole(e.target.value as any)}
              >
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button type="submit" className="btn-primary add-collaborator-btn" disabled={!newEmail.trim()}>
                Add
              </button>
            </div>
          </form>

          <div className="people-access-section">
            <div className="share-section-label">People with access</div>
            <div className="people-list">
              <div className="people-row">
                <div className="avatar small">{getInitials(currentUserName, currentUserEmail)}</div>
                <div className="people-info">
                  <div className="people-name">
                    {currentUserName} <span className="you-tag">(You)</span>
                  </div>
                  <div className="people-email">{currentUserEmail}</div>
                </div>
                <span className="owner-badge">Owner</span>
              </div>

              {collaborators.map((collab) => (
                <div key={collab.email} className="people-row">
                  <div className="avatar small">{getInitials(collab.email, collab.email)}</div>
                  <div className="people-info">
                    <div className="people-name">{collab.email.split("@")[0]}</div>
                    <div className="people-email">{collab.email}</div>
                  </div>
                  <div className="people-actions">
                    <select
                      className="share-select role-select-compact"
                      value={collab.role}
                      onChange={(e) => handleRoleChange(collab.email, e.target.value as any)}
                    >
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <button
                      className="btn-remove-user"
                      title="Remove access"
                      onClick={() => handleRemoveCollaborator(collab.email)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="general-access-section">
            <div className="share-section-label">General access</div>
            <div className="access-config-box">
              <div className="access-scope-row">
                <div className="scope-icon-box">
                  {accessScope === "restricted" ? <Lock size={18} /> : <Globe size={18} />}
                </div>
                <div className="scope-details">
                  <select
                    className="share-select scope-select"
                    value={accessScope}
                    onChange={(e) => {
                      setAccessScope(e.target.value as any);
                      persistAndBroadcast(collaborators, e.target.value as any, generalRole);
                    }}
                  >
                    <option value="restricted">Restricted (Only added members)</option>
                    <option value="anyone">Anyone with the link</option>
                  </select>
                  <div className="scope-desc">
                    {accessScope === "restricted"
                      ? "Only people listed in 'People with access' can open this CAD project."
                      : "Anyone on the web with this link can access."}
                  </div>
                  {accessScope === "anyone" && (
                    <select
                      className="share-select scope-select"
                      aria-label="Anyone with the link role"
                      value={generalRole}
                      onChange={(e) => {
                        const role = e.target.value as "Editor" | "Viewer";
                        setGeneralRole(role);
                        persistAndBroadcast(collaborators, accessScope, role);
                      }}
                    >
                      <option value="Editor">Anyone with the link can edit</option>
                      <option value="Viewer">Anyone with the link can view</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="link-preview-container">
            <div className="link-input-wrapper">
              <LinkIcon size={14} className="link-input-icon" />
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="link-input-field"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer share-modal-footer">
          <button className="btn-copy-link" onClick={handleCopyLink}>
            {copied ? <Check size={14} color="#5cbe7e" /> : <Copy size={14} />}
            {copied ? "Link Copied!" : "Copy Link"}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================== Workbench ============================== */

interface WorkbenchProps {
  project: Project;
  currentUserName: string;
  onBack: () => void;
  notify: (msg: string, type?: "success" | "info") => void;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  openErrorModal: (pos: [number, number, number]) => void;
  onShareProject: () => void;
  modelProps: ModelProps;
  setModelProps: React.Dispatch<React.SetStateAction<ModelProps>>;
}

function Workbench({
  project,
  currentUserName,
  onBack,
  notify,
  annotations,
  setAnnotations,
  openErrorModal,
  onShareProject,
  modelProps,
  setModelProps,
}: WorkbenchProps) {
  const [activeTool, setActiveTool] = useState("select");
  const [activeRibbonTab, setActiveRibbonTab] = useState("HOME");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerCommand, setViewerCommand] = useState<{ id: number; type: string }>({
    id: 0,
    type: "",
  });

  const sendViewerCommand = (type: string) => {
    setViewerCommand({ id: Date.now(), type });
  };

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", user: "System", text: "Live Collaborative Session Started", time: "Just now" },
  ]);
  const [activeTab, setActiveTab] = useState<"chat" | "issues">("chat");

  const isViewerOnly = project.role?.toLowerCase() === "viewer";

  // Listen for team chat synchronization
  useEffect(() => {
    const channel = new BroadcastChannel("cad_platform_team_sync");
    channel.onmessage = (event) => {
      if (event.data?.type === "NEW_CHAT_MSG" && event.data.projectId === project.id) {
        setMessages((prev) => [...prev, event.data.msg]);
      }
    };
    return () => {
      channel.close();
    };
  }, [project.id]);

  const triggerExport = () => {
    notify(`Successfully exported ${project.name}_FINAL.step`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      notify(`Imported model: ${file.name}`, "success");
      sendViewerCommand("upload");
    }
  };

  const ribbonTabs = [
    "HOME",
    "PROJECT",
    "SCHEMATIC",
    "PANEL",
    "REPORTS",
    "IMPORT/EXPORT DATA",
    "ELECTROMECHANICAL",
    "CONVERSION TOOLS",
    "ADD-INS",
    "COLLABORATE",
    "FEATURED APPS",
  ];

  return (
    <div className="workbench-view">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".step,.stp,.stl,.obj,.gltf,.glb"
        onChange={handleFileUpload}
      />

      <header className="wb-topbar">
        <div className="topbar-left">
          <div className="menu-icon" onClick={onBack} title="Return to Hub">
            <Box size={16} />
          </div>
          <span className="menu-item" onClick={() => fileInputRef.current?.click()}>Import</span>
          <span className="menu-item" onClick={triggerExport}>Export</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">Render</span>
          <span className="menu-item" onClick={onBack}>Hub</span>
        </div>
        <div className="project-title">
          {project.name} - CAD Workbench {isViewerOnly && <span className="viewer-indicator">(Viewer Mode)</span>}
        </div>
        <div className="topbar-right">
          <button
            className="wb-share-button"
            onClick={onShareProject}
            title="Share project with specific permissions"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </header>

      <div className="autocad-ribbon">
        <div className="ribbon-tabs">
          {ribbonTabs.map((tab) => (
            <div
              key={tab}
              className={`ribbon-tab ${activeRibbonTab === tab ? "active" : ""}`}
              onClick={() => setActiveRibbonTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="ribbon-toolbar">
          <div className="ribbon-toolbar-group">
            <span className="header-label">Shading:</span>
            <button
              className={`ribbon-btn ${modelProps.wireframe ? "active" : ""}`}
              onClick={() => setModelProps((prev) => ({ ...prev, wireframe: !prev.wireframe }))}
              title="Toggle wireframe mode"
            >
              <Layers size={13} />
              <span>{modelProps.wireframe ? "Wireframe" : "Shaded"}</span>
            </button>
          </div>
          <div className="ribbon-divider" />

          {activeRibbonTab === "HOME" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => fileInputRef.current?.click()}
                  title={isViewerOnly ? "View only access" : ""}
                >
                  <Upload size={14} />
                  <span>Upload Model</span>
                </button>
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("primitive")}
                >
                  <Plus size={14} />
                  <span>Primitive</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("move")}
                >
                  <Move size={14} />
                  <span>Move</span>
                </button>
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("rotate")}
                >
                  <RotateCw size={14} />
                  <span>Rotate</span>
                </button>
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("scale")}
                >
                  <Maximize size={14} />
                  <span>Scale</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("undo")}
                >
                  <Undo2 size={14} />
                  <span>Undo</span>
                </button>
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => sendViewerCommand("redo")}
                >
                  <Redo2 size={14} />
                  <span>Redo</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className={`ribbon-btn ${activeTool === "pin" ? "active" : ""}`}
                  onClick={() => {
                    const next = activeTool === "pin" ? "select" : "pin";
                    setActiveTool(next);
                    if (next === "pin") {
                      notify("Click anywhere on the model or use '+ Flag Issue' in the panel to place an annotation pin.", "info");
                    }
                  }}
                >
                  <Pin size={14} />
                  <span>Annotation</span>
                </button>
                <button
                  className="ribbon-btn"
                  onClick={() =>
                    notify("Select two vertex points to calculate precise dimensions.", "info")
                  }
                >
                  <Ruler size={14} />
                  <span>Dimension</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "PROJECT" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => notify("Project Manager Active", "info")}
                >
                  <Folder size={14} />
                  <span>Manager</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  disabled={isViewerOnly}
                  onClick={() => {
                    setModelProps({
                      ...modelProps,
                      extraParts: modelProps.extraParts + 1,
                    });
                    notify("New CAD component added to assembly tree", "success");
                  }}
                >
                  <FolderPlus size={14} />
                  <span>New Part</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => notify("Synchronized viewport with latest changes.")}
                >
                  <RefreshCw size={14} />
                  <span>Update</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "COLLABORATE" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn" onClick={onShareProject}>
                  <Share2 size={14} />
                  <span>Share Project</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button className="ribbon-btn" onClick={() => setActiveTab("chat")}>
                  <MessageCircle size={14} />
                  <span>Open Chat</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "REPORTS" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() =>
                    notify("BOM Report Generated successfully!", "success")
                  }
                >
                  <FileSpreadsheet size={14} />
                  <span>BOM</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => notify("0 Missing Components found.", "info")}
                >
                  <AlertTriangle size={14} />
                  <span>Missing</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "IMPORT/EXPORT DATA" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn" onClick={triggerExport}>
                  <FileDown size={14} />
                  <span>Export STEP</span>
                </button>
                <button
                  className="ribbon-btn"
                  onClick={() => notify("Exporting BOM breakdown to Excel...")}
                >
                  <Table size={14} />
                  <span>To Excel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="wb-main">
        <div className="viewport-container">
          <ThreeDViewer
            projectId={project.id}
            viewerCommand={viewerCommand}
            onAnnotationsChange={(items: any[]) => {
              setAnnotations(
                items.map((item) => ({
                  id: String(item.id ?? item.annotation_id),
                  position: item.position ?? [
                    item.x ?? 0,
                    item.y ?? 0,
                    item.z ?? 0,
                  ],
                  text: item.comment ?? item.title ?? "Untitled annotation",
                  user: item.creator ?? item.user ?? "Engineer",
                  resolved:
                    item.status === "Resolved" ||
                    item.status === "FIXED" ||
                    item.status === "CLOSED",
                }))
              );
            }}
          />
        </div>

        <aside className="collab-panel">
          <div className="panel-tabs">
            <button
              className={`tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Team Chat
            </button>
            <button
              className={`tab ${activeTab === "issues" ? "active" : ""}`}
              onClick={() => setActiveTab("issues")}
            >
              Issue Log ({annotations.length})
            </button>
          </div>
          <div className="panel-content">
            {activeTab === "chat" ? (
              <ChatPanel
                projectId={project.id}
                currentUserName={currentUserName}
                messages={messages}
                setMessages={setMessages}
              />
            ) : (
              <div className="issue-log">
                <div className="outliner-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Pinned Errors</span>
                  <button
                    className="btn-copy-small"
                    style={{ padding: "3px 8px" }}
                    onClick={() => openErrorModal([0, 1, 0])}
                  >
                    <Plus size={11} /> Flag Issue
                  </button>
                </div>
                {annotations.length === 0 && (
                  <p className="empty-msg">No errors flagged on this model.</p>
                )}
                {annotations.map((a: Annotation) => (
                  <div key={a.id} className="issue-card">
                    <div className="issue-user">
                      <strong>{a.user}</strong>
                    </div>
                    <div className="issue-text">{a.text}</div>
                    <button
                      className="btn-resolve"
                      onClick={() => {
                        setAnnotations((current: Annotation[]) =>
                          current.filter((ann: Annotation) => ann.id !== a.id)
                        );
                        setViewerCommand({
                          type: "remove-annotation",
                          id: Number(a.id),
                        });
                        const channel = new BroadcastChannel("cad_platform_team_sync");
                        channel.postMessage({
                          type: "RESOLVE_ANNOTATION",
                          annotationId: a.id,
                        });
                        setTimeout(() => channel.close(), 1000);
                      }}
                    >
                      Mark Fixed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================== Chat Panel ============================== */

interface ChatPanelProps {
  projectId: string;
  currentUserName: string;
  messages: ChatMsg[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
}

function ChatPanel({ projectId, currentUserName, messages, setMessages }: ChatPanelProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg: ChatMsg = {
      id: Date.now().toString(),
      user: currentUserName,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    const channel = new BroadcastChannel("cad_platform_team_sync");
    channel.postMessage({
      type: "NEW_CHAT_MSG",
      projectId,
      msg: newMsg,
    });
    setTimeout(() => channel.close(), 1000);
  };

  return (
    <div className="chat-box">
      <div className="chat-msgs">
        {messages.map((m: ChatMsg) => (
          <div key={m.id} className="msg-user">
            <div className="msg-header">
              <strong>{m.user}</strong> <span className="msg-time">{m.time}</span>
            </div>
            <div className="msg-body">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          placeholder="Message engineering team..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================== Import Modal ============================== */

interface ImportModalProps {
  onClose: () => void;
  onConfirm: (projectName: string, description: string) => Promise<void>;
}

function ImportModal({ onClose, onConfirm }: ImportModalProps) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!projectName.trim() || creating) return;
    setCreating(true);
    try {
      await onConfirm(projectName, description);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay-blur">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Create CAD Project</h3>
          <X className="close-icon" onClick={onClose} size={16} />
        </div>
        <div className="modal-body">
          <label>Project Name</label>
          <input
            className="project-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Steering Assembly"
            autoFocus
          />
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the CAD project..."
          />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!projectName.trim() || creating}
            onClick={submit}
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== CSS Styles ============================== */

const CSS = `
:root {
  --bg-dark: #121212;       
  --bg-panel: #1A1A1A;      
  --bg-raise: #242424;      
  --bg-viewport: #222222;   
  --accent: #4772B3;        
  --accent-cyan: rgba(64,232,244,1);
  --accent-orange: #FF7700; 
  --text-main: #EDEDED;
  --text-dim: #949494;
  --border: #0A0A0A;        
  --border-light: #2E2E2E;  
  --btn-bg: #333333;
  --btn-hover: #454545;
  --success: #5cbe7e;
  --danger: #e2584a;
}

* { box-sizing: border-box; }

.app-container { height: 100vh; background: var(--bg-dark); color: var(--text-main); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; position: relative; font-size: 13px; }

/* Overlays & Modals */
.notification-toast { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); z-index: 99999; background: var(--bg-raise); border: 1px solid var(--border-light); padding: 10px 18px; border-radius: 6px; display: flex; align-items: center; gap: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.6); }
.notification-toast.success { border-left: 4px solid var(--success); }
.notification-toast.info { border-left: 4px solid var(--accent); }
.toast-content { font-size: 13px; color: var(--text-main); }

.modal-overlay-blur { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 99999; backdrop-filter: blur(2px); }
.error-input-modal, .modal-card, .share-modal-card { width: 460px; background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden; }
.share-modal-card { width: 530px; max-height: 88vh; }

.modal-header { background: var(--bg-raise); padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 15px; font-weight: 500; }
.close-icon { cursor: pointer; color: var(--text-dim); }
.close-icon:hover { color: white; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-body label { font-size: 12px; color: var(--text-dim); font-weight: 500; }
.modal-body textarea { background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 4px; padding: 12px; color: white; font-family: inherit; font-size: 13px; resize: none; height: 90px; outline: none; }
.modal-body textarea:focus { border-color: var(--accent-cyan); }
.modal-body input.project-input { background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 4px; padding: 10px 12px; color: white; font-size: 13px; outline: none; }
.modal-body input.project-input:focus { border-color: var(--accent-cyan); }
.project-hint { margin: 4px 0 0; color: var(--text-dim); font-size: 11px; line-height: 1.4; }
.modal-footer { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-raise); }

/* HUB & NAVBAR */
.hub-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.hub-nav { height: 50px; background: var(--bg-raise); border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 20px; flex-shrink: 0; }
.logo { justify-self: start; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14px; }
.nav-links { justify-self: center; display: flex; gap: 20px; height: 100%; }
.nav-item { display: flex; align-items: center; gap: 6px; color: var(--text-dim); cursor: pointer; padding: 0 10px; border-bottom: 2px solid transparent; font-size: 13px; position: relative; }
.nav-item:hover { color: var(--text-main); }
.nav-item.active { color: #fff; border-bottom-color: var(--accent-cyan); }
.badge-notification { background: var(--accent); color: white; font-size: 10px; font-weight: bold; border-radius: 10px; padding: 1px 6px; margin-left: 2px; }
.user-profile { justify-self: end; }

.hub-content { padding: 32px 40px; overflow-y: auto; flex: 1; background: var(--bg-dark); display: flex; flex-direction: column; }
.hub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.hub-header h1 { font-size: 22px; margin: 0 0 6px 0; font-weight: 500; color: #fff; }
.hub-header p { margin: 0; color: var(--text-dim); font-size: 13px; }

/* Enhanced Team Section */
.team-enhanced-section { width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.team-hub-header { border-bottom: 1px solid #262626; padding-bottom: 18px; margin-bottom: 18px; }

/* KPI Cards */
.team-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 10px; }
.stat-card { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 8px; padding: 18px; display: flex; align-items: center; gap: 16px; transition: transform 0.2s, border-color 0.2s; }
.stat-card:hover { border-color: rgba(64,232,244,0.3); transform: translateY(-2px); }
.stat-icon-wrapper { width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-wrapper.cyan { background: rgba(64,232,244,0.12); color: var(--accent-cyan); }
.stat-icon-wrapper.green { background: rgba(92,190,126,0.12); color: var(--success); }
.stat-icon-wrapper.orange { background: rgba(255,119,0,0.12); color: var(--accent-orange); }
.stat-icon-wrapper.purple { background: rgba(168,85,247,0.12); color: #c084fc; }

.stat-details { display: flex; flex-direction: column; gap: 3px; }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); }
.stat-number { font-size: 22px; font-weight: 600; color: #ffffff; }

/* Subtabs & Filters */
.team-subtabs-toolbar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; gap: 16px; flex-wrap: wrap; }
.team-subtabs { display: flex; gap: 8px; }
.team-subtab-btn { background: transparent; border: 1px solid transparent; color: var(--text-dim); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 7px; transition: 0.15s; }
.team-subtab-btn:hover { color: #fff; background: rgba(255,255,255,0.03); }
.team-subtab-btn.active { color: var(--accent-cyan); background: rgba(64,232,244,0.08); border-color: rgba(64,232,244,0.25); }

.team-filters { display: flex; align-items: center; gap: 10px; }
.team-search-input { display: flex; align-items: center; background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 6px; padding: 6px 10px; gap: 8px; width: 230px; }
.team-search-input input { background: transparent; border: none; outline: none; color: #fff; font-size: 12px; width: 100%; }
.search-icon { color: var(--text-dim); }
.clear-search { cursor: pointer; color: var(--text-dim); }
.clear-search:hover { color: #fff; }
.team-role-filter { padding: 6px 12px; font-size: 12px; background: var(--bg-panel); border-color: var(--border-light); }

/* Enhanced Team Table */
.team-table-container { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 8px; overflow: hidden; }
.team-table { width: 100%; border-collapse: collapse; text-align: left; }
.team-table th { background: var(--bg-raise); padding: 14px 18px; font-weight: 500; color: var(--text-dim); border-bottom: 1px solid var(--border); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
.team-table td { padding: 14px 18px; border-bottom: 1px solid var(--border-light); font-size: 13px; vertical-align: middle; }
.team-table tr:hover { background: rgba(255,255,255,0.015); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar-wrapper { position: relative; }
.status-dot-badge { position: absolute; bottom: -1px; right: -1px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--bg-panel); }
.status-dot-badge.online { background: var(--success); }
.status-dot-badge.in-workbench { background: var(--accent-cyan); }
.status-dot-badge.away { background: #888; }

.member-name-text { color: #fff; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.you-pill { background: rgba(64,232,244,0.15); color: var(--accent-cyan); font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
.dim-text { color: var(--text-dim); }

.role-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; text-transform: capitalize; display: inline-flex; }
.role-badge.owner { background: rgba(71, 114, 179, 0.25); border: 1px solid var(--accent); color: #8bb2f2; }
.role-badge.editor { background: rgba(64, 232, 244, 0.12); border: 1px solid rgba(64,232,244,0.3); color: var(--accent-cyan); }
.role-badge.viewer { background: rgba(255, 255, 255, 0.08); border: 1px solid #444; color: #bbb; }

.project-access-tag { background: #121212; border: 1px solid #2a2a2a; padding: 3px 8px; border-radius: 4px; font-size: 11px; color: #ccc; }

.status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 10px; border-radius: 12px; background: rgba(255,255,255,0.03); }
.status-pill.online { color: var(--success); background: rgba(92,190,126,0.1); }
.status-pill.in-workbench { color: var(--accent-cyan); background: rgba(64,232,244,0.1); }
.status-pill.away { color: #888; background: rgba(255,255,255,0.04); }
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.btn-copy-small { background: var(--bg-dark); border: 1px solid var(--border-light); color: #fff; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; }
.btn-copy-small:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
.empty-subtab-state { padding: 50px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-subtab-state h3 { margin: 0; color: #fff; font-weight: 500; }
.empty-subtab-state p { margin: 0 0 10px; color: #888; font-size: 13px; max-width: 360px; }

/* Permission Matrix */
.matrix-card { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 8px; overflow: hidden; padding: 20px; }
.matrix-header { margin-bottom: 18px; border-bottom: 1px solid #262626; padding-bottom: 14px; }
.matrix-header h3 { margin: 0 0 6px 0; color: #fff; font-size: 16px; font-weight: 500; }
.matrix-header p { margin: 0; color: var(--text-dim); font-size: 13px; }
.matrix-table { width: 100%; border-collapse: collapse; text-align: left; }
.matrix-table th { padding: 12px 14px; font-weight: 500; color: var(--text-dim); border-bottom: 1px solid var(--border); font-size: 12px; }
.matrix-table td { padding: 14px; border-bottom: 1px solid #262626; font-size: 13px; }
.denied-dash { color: #555; font-weight: bold; }

/* DOCS & COLAB STYLE SHARE MODAL */
.share-header-title { display: flex; align-items: center; gap: 8px; }
.share-modal-body { gap: 14px; padding: 18px 22px; overflow-y: auto; }
.share-section-label { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }

.add-people-form { margin: 0; }
.add-people-input-row { display: flex; align-items: center; background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 6px; padding: 4px 6px 4px 12px; gap: 8px; }
.add-people-input-row:focus-within { border-color: var(--accent-cyan); }
.add-mail-icon { color: var(--text-dim); flex-shrink: 0; }
.add-people-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 13px; outline: none; padding: 6px 0; }
.add-role-select { background: var(--bg-raise); border: 1px solid var(--border-light); border-radius: 4px; padding: 5px 8px; }
.add-collaborator-btn { padding: 6px 14px; font-size: 12px; }

.people-access-section { display: flex; flex-direction: column; gap: 8px; }
.people-list { display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; }
.people-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 5px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); }
.people-info { flex: 1; margin-left: 10px; display: flex; flex-direction: column; }
.people-name { color: #fff; font-size: 13px; font-weight: 500; }
.you-tag { color: var(--text-dim); font-weight: normal; }
.people-email { color: var(--text-dim); font-size: 11px; }
.owner-badge { font-size: 11px; color: var(--text-dim); background: var(--bg-raise); padding: 3px 8px; border-radius: 3px; }
.people-actions { display: flex; align-items: center; gap: 6px; }
.role-select-compact { padding: 4px 6px; font-size: 11px; }
.btn-remove-user { background: transparent; border: none; color: var(--text-dim); cursor: pointer; padding: 4px; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
.btn-remove-user:hover { color: var(--danger); background: rgba(226, 88, 74, 0.15); }

.access-config-box { background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px 14px; }
.access-scope-row { display: flex; align-items: center; gap: 12px; }
.scope-icon-box { width: 34px; height: 34px; border-radius: 50%; background: var(--bg-raise); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan); flex-shrink: 0; }
.scope-details { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.scope-desc { font-size: 11px; color: var(--text-dim); }
.share-select { background: var(--bg-panel); border: 1px solid var(--border-light); color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 12px; outline: none; cursor: pointer; }
.share-select:focus { border-color: var(--accent); }
.scope-select { font-weight: 500; font-size: 13px; border: none; background: transparent; color: #fff; padding: 0; cursor: pointer; }

.link-preview-container { margin-top: 4px; }
.link-input-wrapper { display: flex; align-items: center; background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 5px; padding: 4px 10px; }
.link-input-icon { color: var(--text-dim); margin-right: 8px; flex-shrink: 0; }
.link-input-field { background: transparent; border: none; color: #aaa; width: 100%; font-size: 12px; outline: none; cursor: pointer; text-overflow: ellipsis; }

.share-modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-top: 1px solid var(--border); background: var(--bg-raise); }
.btn-copy-link { background: var(--bg-dark); border: 1px solid var(--border-light); color: #fff; padding: 7px 14px; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; font-weight: 500; }
.btn-copy-link:hover { border-color: var(--accent-cyan); }

/* PROJECT GRID */
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 2px dashed var(--border-light); border-radius: 8px; background: rgba(255, 255, 255, 0.01); min-height: 400px; padding: 40px; }
.empty-icon { color: var(--text-dim); margin-bottom: 20px; background: var(--bg-raise); padding: 20px; border-radius: 50%; border: 1px solid var(--border-light); }
.empty-state h2 { margin: 0 0 10px 0; font-size: 18px; color: var(--text-main); font-weight: normal; }
.empty-state p { margin: 0 0 25px 0; color: var(--text-dim); font-size: 13px; max-width: 400px; line-height: 1.5; }

.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.project-card { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 6px; cursor: pointer; transition: 0.15s; position: relative; }
.project-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.card-thumb { height: 130px; background: #000; display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; border-radius: 6px 6px 0 0; }
.thumb-label { font-size: 10px; background: var(--bg-raise); color: var(--text-main); padding: 3px 6px; border-radius: 2px; }
.card-share-btn { background: rgba(0,0,0,0.6); border: 1px solid var(--border-light); color: var(--text-dim); border-radius: 4px; padding: 5px; cursor: pointer; }
.card-share-btn:hover { color: #fff; background: var(--accent); }
.card-info { padding: 15px; }
.card-info h3 { margin: 0; font-size: 14px; font-weight: 500; }
.card-info p { font-size: 12px; color: var(--text-dim); margin-top: 6px; }
.card-arrow { position: absolute; right: 15px; bottom: 15px; color: var(--text-dim); }

/* ACCOUNT SECTION */
.account-section { width: 100%; max-width: 800px; margin: 0 auto; }
.account-header { margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--border-light); }
.account-header h1 { font-size: 22px; color: #fff; font-weight: 500; margin: 0 0 6px 0; }
.account-header p { color: var(--text-dim); margin: 0; font-size: 13px; }
.account-layout { display: flex; flex-direction: column; gap: 20px; }
.account-card-new { background: #000000; border: 1px solid rgba(64,232,244,0.35); border-radius: 8px; padding: 24px; }
.account-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.account-card-header h3 { margin: 0; font-size: 16px; font-weight: 500; color: #ffffff; }
.account-card-body { display: flex; flex-direction: column; gap: 16px; }
.profile-identity-banner { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid #1a1a1a; }
.avatar-large { width: 50px; height: 50px; border-radius: 50%; background: #1a1a1a; border: 1px solid rgba(64,232,244,0.5); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: var(--accent-cyan); }
.account-field-row { display: flex; flex-direction: column; gap: 6px; }
.account-field-row label { font-size: 12px; color: #aaa; }
.account-field-row input, .account-select { background: #111; border: 1px solid rgba(64,232,244,0.35); color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
.preference-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #0c0c0c; border: 1px solid #222; border-radius: 6px; }

/* WORKBENCH */
.workbench-view { display: flex; flex-direction: column; height: 100vh; background: var(--bg-dark); }
.wb-topbar { height: 38px; background: var(--bg-dark); display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; font-size: 12px; position: relative; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.menu-icon { color: var(--text-main); cursor: pointer; }
.menu-item { color: var(--text-main); cursor: pointer; padding: 4px 6px; border-radius: 3px; }
.menu-item:hover { background: rgba(255,255,255,0.1); }
.project-title { color: var(--text-dim); position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; pointer-events: none; }
.viewer-indicator { color: var(--accent-orange); font-size: 11px; margin-left: 6px; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.wb-share-button { display: flex; align-items: center; gap: 6px; background: var(--accent); color: white; border: none; padding: 5px 14px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; }

/* AUTOCAD RIBBON */
.autocad-ribbon { display: flex; flex-direction: column; flex-shrink: 0; }
.ribbon-tabs { display: flex; background: var(--bg-dark); padding-top: 4px; padding-left: 10px; gap: 2px; }
.ribbon-tab { padding: 6px 14px; color: var(--text-dim); cursor: pointer; border-radius: 4px 4px 0 0; font-size: 12px; }
.ribbon-tab:hover { color: var(--text-main); }
.ribbon-tab.active { background: var(--bg-raise); color: var(--text-main); }
.ribbon-toolbar { background: var(--bg-raise); min-height: 38px; padding: 0 10px; display: flex; align-items: center; overflow-x: auto; gap: 10px; border-bottom: 1px solid var(--border); }
.ribbon-toolbar-group { display: flex; align-items: center; gap: 8px; }
.header-label { color: var(--text-dim); font-size: 12px; }
.dropdown-mock { background: var(--bg-dark); border: 1px solid var(--border-light); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
.ribbon-panel-group { display: flex; align-items: center; height: 100%; gap: 8px; }
.ribbon-col { display: flex; flex-direction: row; align-items: center; gap: 4px; }
.ribbon-btn { display: flex; flex-direction: row; align-items: center; background: transparent; border: 1px solid transparent; color: var(--text-main); cursor: pointer; border-radius: 3px; padding: 5px 8px; }
.ribbon-btn span { margin-left: 6px; font-size: 12px; }
.ribbon-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.ribbon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ribbon-btn.active { background: var(--accent); color: white; }
.ribbon-divider { width: 1px; height: 18px; background: var(--border-light); margin: 0 6px; }

.wb-main { flex: 1; display: flex; overflow: hidden; }
.viewport-container { flex: 1; position: relative; background: var(--bg-viewport); display: flex; flex-direction: column; }
.collab-panel { width: 340px; background: var(--bg-panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
.panel-tabs { display: flex; background: var(--bg-raise); border-bottom: 1px solid var(--border); }
.tab { flex: 1; padding: 10px; background: transparent; border: none; color: var(--text-dim); cursor: pointer; font-size: 12px; border-bottom: 2px solid transparent; }
.tab:hover { color: var(--text-main); }
.tab.active { color: var(--text-main); border-bottom: 2px solid var(--accent); }
.panel-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

/* CHAT & ISSUES */
.chat-box { flex: 1; display: flex; flex-direction: column; background: var(--bg-panel); }
.chat-msgs { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.msg-user { background: var(--bg-raise); padding: 10px 12px; border-radius: 4px; border: 1px solid var(--border-light); }
.msg-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.msg-header strong { color: var(--accent); font-weight: normal; }
.msg-time { font-size: 11px; color: var(--text-dim); }
.msg-body { color: var(--text-main); line-height: 1.4; }
.chat-input { display: flex; padding: 10px; background: var(--bg-raise); border-top: 1px solid var(--border); }
.chat-input input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border-light); color: white; padding: 8px 10px; border-radius: 3px; outline: none; font-size: 13px; }
.chat-input input:focus { border-color: var(--accent); }
.chat-input button { background: var(--btn-bg); border: 1px solid var(--border-light); color: white; padding: 6px 12px; margin-left: 8px; border-radius: 3px; cursor: pointer; }
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

.issue-log { padding: 12px; }
.outliner-header { background: var(--bg-raise); padding: 8px 12px; border-radius: 3px; margin-bottom: 10px; color: var(--text-main); border: 1px solid var(--border-light); font-weight: 500; }
.issue-card { background: var(--bg-raise); border: 1px solid var(--border-light); border-left: 3px solid var(--accent-orange); padding: 10px 12px; border-radius: 3px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
.issue-user strong { color: var(--text-dim); font-weight: normal; }
.issue-text { color: var(--text-main); line-height: 1.4; }
.btn-resolve { align-self: flex-start; background: var(--bg-dark); border: 1px solid var(--border-light); color: var(--text-main); padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
.btn-resolve:hover { background: var(--success); color: var(--bg-dark); }
.empty-msg { color: var(--text-dim); padding: 15px; text-align: center; }

/* UTILS */
.btn-primary { background: var(--accent); color: white; border: none; padding: 8px 14px; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--btn-bg); color: var(--text-main); border: 1px solid var(--border-light); padding: 8px 14px; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
.btn-secondary:hover { background: var(--btn-hover); }
.avatar { width: 32px; height: 32px; background: #222; border: 1px solid var(--border-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: var(--accent-cyan); flex-shrink: 0; }
.avatar.small { width: 26px; height: 26px; font-size: 10px; }
`;
