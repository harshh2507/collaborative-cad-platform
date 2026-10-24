import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { projectsApi, authApi } from "../services/api";
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
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  status: "Online" | "Offline" | "Away";
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

  // 3D Model State
  const [modelProps, setModelProps] = useState<ModelProps>({
    wireframe: false,
    scale: 1,
    color: 0x808080,
    extraParts: 0,
  });

  const currentUserName =
    (user as any)?.name || (user as any)?.username || "My Account (You)";
  const currentUserEmail = user?.email || "admin@workbench.cloud";
  const currentUserRole = (user as any)?.role || "Owner";

  // Initial Team list with current user
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "me",
      name: currentUserName,
      email: currentUserEmail,
      role: currentUserRole,
      joinedAt: new Date().toLocaleDateString(),
      status: "Online",
    },
  ]);

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

  // Keep current user updated
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

  // Real-time synchronization channel between tabs/browsers
  useEffect(() => {
    const channel = new BroadcastChannel("cad_platform_team_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "COLLABORATOR_JOINED") {
        const newCollaborator = event.data.user;
        setTeamMembers((prev) => {
          if (prev.some((m) => m.email === newCollaborator.email)) return prev;
          return [
            ...prev,
            {
              id: String(Date.now()),
              name: newCollaborator.name,
              email: newCollaborator.email,
              role: "Collaborator",
              joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "Online",
            },
          ];
        });
        showNotify(`${newCollaborator.name} joined the workspace!`, "success");
      }
    };

    const joinedViaInvite = searchParams.get("inviteJoined");
    if (joinedViaInvite && user) {
      channel.postMessage({
        type: "COLLABORATOR_JOINED",
        user: {
          name: currentUserName,
          email: currentUserEmail,
        },
      });
      showNotify(`Joined collaborative workspace successfully!`, "success");
    }

    return () => {
      channel.close();
    };
  }, [searchParams, user, currentUserName, currentUserEmail]);

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
        }));

        setProjects(formattedProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    };

    loadProjects();
  }, [currentUserName]);

  // Auto-launch the shared project for the invited user directly into Workbench
  useEffect(() => {
    const inviteProjectId = searchParams.get("projectId");
    const inviteProjectName = searchParams.get("projectName");
    const inviter = searchParams.get("from") || "Teammate";

    if (inviteProjectId) {
      const sharedProject: Project = {
        id: inviteProjectId,
        name: inviteProjectName ? decodeURIComponent(inviteProjectName) : "Collaborative Assembly",
        date: `Shared by ${inviter}`,
        collaborators: [inviter, currentUserName],
        fileType: "CAD",
      };

      setProjects((prev) => {
        if (prev.some((p) => p.id === sharedProject.id)) return prev;
        return [sharedProject, ...prev];
      });

      setSelectedProject(sharedProject);
      setCurrentView("WORKBENCH");
      showNotify(`Joined ${inviter}'s live CAD project: ${sharedProject.name}!`, "success");
    }
  }, [searchParams, currentUserName]);

  // Invite Link Generator
  const handleGenerateInvite = () => {
    const baseUrl = window.location.origin;
    const inviterName = encodeURIComponent(currentUserName);
    
    const activeProject = selectedProject || projects[0];
    const projectQuery = activeProject
      ? `&projectId=${activeProject.id}&projectName=${encodeURIComponent(activeProject.name)}`
      : "";

    const inviteLink = `${baseUrl}/invite?from=${inviterName}&fromEmail=${encodeURIComponent(currentUserEmail)}${projectQuery}`;

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        showNotify("Invite link copied! Opening this link will bring teammates directly into your project.", "success");
      })
      .catch(() => {
        showNotify(`Invite link: ${inviteLink}`, "info");
      });
  };

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
      };

      setProjects((current) => [...current, newProject]);
      setSelectedProject(newProject);
      setIsImportModalOpen(false);
      setCurrentView("WORKBENCH");
      showNotify(`Project ${newProject.name} created successfully!`);
    } catch (error) {
      console.error("Project creation failed:", error);
      showNotify(
        error instanceof Error ? error.message : "Could not create project",
        "info"
      );
    }
  };

  const handleSaveAnnotation = () => {
    if (!errorText.trim()) return;
    setAllAnnotations([
      ...allAnnotations,
      {
        id: Date.now().toString(),
        position: pendingAnnotation?.pos || [0, 0, 0],
        text: errorText,
        user: currentUserName,
        resolved: false,
      },
    ]);
    setIsErrorModalOpen(false);
    setErrorText("");
    setPendingAnnotation(null);
    showNotify("Error pinned to model");
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
              <h3>Flag Model Error</h3>
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

      {currentView === "HUB" ? (
        <ProjectHub
          projects={projects}
          teamMembers={teamMembers}
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
          onInviteSent={handleGenerateInvite}
        />
      ) : (
        <Workbench
          project={selectedProject!}
          onBack={() => setCurrentView("HUB")}
          notify={showNotify}
          annotations={allAnnotations}
          setAnnotations={setAllAnnotations}
          openErrorModal={(pos: [number, number, number]) => {
            setPendingAnnotation({ pos, project: selectedProject });
            setIsErrorModalOpen(true);
          }}
          onInviteSent={handleGenerateInvite}
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

/* ============================== Project Hub ============================== */

function ProjectHub({
  projects,
  teamMembers,
  currentUserName,
  currentUserEmail,
  currentUserRole,
  onUpdateUser,
  onLogout,
  showNotify,
  onOpenProject,
  onImportClick,
  onInviteSent,
}: any) {
  const [activeTab, setActiveTab] = useState<HubTab>("projects");

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

  const initials = getInitials(currentUserName, currentUserEmail);

  const handleSaveProfile = async () => {
    try {
      await authApi.updateProfile({ name: editName });
      onUpdateUser({ name: editName });
      showNotify("Profile updated successfully!", "success");
    } catch {
      onUpdateUser({ name: editName });
      showNotify("Profile updated!", "success");
    }
  };

  const handleUpdatePassword = async () => {
    if (!currPassword) {
      showNotify("Please enter your current password.", "info");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showNotify("New password must be at least 8 characters long.", "info");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotify("New passwords do not match. Please verify and try again.", "info");
      return;
    }
    if (currPassword === newPassword) {
      showNotify("New password must be different from current password.", "info");
      return;
    }

    try {
      await authApi.changePassword({
        currentPassword: currPassword,
        newPassword: newPassword,
      });
      setCurrPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showNotify("Password changed successfully!", "success");
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("<!DOCTYPE") ||
        msg.includes("JSON") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("Unexpected token")
      ) {
        showNotify("Current password does not match. Please check your credentials.", "info");
      } else {
        showNotify(msg || "Current password does not match. Please try again.", "info");
      }
    }
  };

  return (
    <div className="hub-view">
      <nav className="hub-nav">
        <div className="logo">
          <Box className="logo-icon" size={20} />
          <span>Workbench</span>
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
        {/* PROJECTS TAB */}
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
                  You haven't uploaded any models yet. Start a new assembly to
                  begin collaborating.
                </p>
                <button
                  className="btn-primary"
                  onClick={onImportClick}
                  style={{ padding: "10px 24px", fontSize: "14px" }}
                >
                  Import CAD Model
                </button>
              </div>
            ) : (
              <div className="project-grid">
                {projects.map((p: any) => (
                  <div
                    key={p.id}
                    className="project-card"
                    onClick={() => onOpenProject(p)}
                  >
                    <div className="card-thumb">
                      <div className="thumb-label">{p.fileType}</div>
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

        {/* TEAM TAB */}
        {activeTab === "team" && (
          <div className="tab-section">
            <header className="hub-header">
              <div>
                <h1>Team Management</h1>
                <p>Manage access, roles, and active collaborators.</p>
              </div>
              <button className="btn-primary" onClick={onInviteSent}>
                <Share2 size={16} /> Generate Invite Link
              </button>
            </header>
            <div className="team-table-container">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member: TeamMember) => (
                    <tr key={member.id}>
                      <td className="user-cell">
                        <div className="avatar small">
                          {getInitials(member.name, member.email)}
                        </div>
                        <span style={{ color: "#fff", fontWeight: 500 }}>
                          {member.name} {member.id === "me" && "(You)"}
                        </span>
                      </td>
                      <td className="dim-text">
                        <Mail
                          size={14}
                          style={{ display: "inline", marginRight: 6 }}
                        />
                        {member.email}
                      </td>
                      <td>
                        <span
                          className={`role-badge ${member.role.toLowerCase()}`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="dim-text">
                        <Clock
                          size={14}
                          style={{ display: "inline", marginRight: 6 }}
                        />
                        {member.joinedAt}
                      </td>
                      <td>
                        <span className="status-indicator">
                          <span
                            className={`dot ${member.status.toLowerCase()}`}
                          ></span>{" "}
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="tab-section account-section">
            <header className="account-header">
              <h1>Account Settings</h1>
              <p>Manage your login details, security, and workspace preferences.</p>
            </header>

            <div className="account-layout">
              {/* Profile Details */}
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
                    onClick={handleSaveProfile}
                  >
                    <Save size={15} /> Save Profile Changes
                  </button>
                </div>
              </div>

              {/* Security & Password */}
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
                    onClick={handleUpdatePassword}
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* CAD Preferences */}
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

              {/* Session / Danger Zone */}
              <div
                className="account-card-new"
                style={{ borderColor: "rgba(226, 88, 74, 0.4)" }}
              >
                <div className="account-card-header">
                  <LogOut size={20} color="#e2584a" />
                  <h3 style={{ color: "#e2584a" }}>Session & Danger Zone</h3>
                </div>
                <div className="account-card-body">
                  <p style={{ color: "#aaa", margin: 0 }}>
                    Sign out of your active session on this workstation.
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

/* ============================== Import Modal ============================== */

function ImportModal({ onClose, onConfirm }: any) {
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
          <h3>Create Project</h3>
          <X className="close-icon" onClick={onClose} size={16} />
        </div>
        <div className="modal-body">
          <label>Project Name</label>
          <input
            className="project-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Automotive Assembly"
            autoFocus
          />
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the CAD project..."
          />
          <p className="project-hint">
            Create the project first. You can upload the 3D model from the Workbench.
          </p>
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

/* ============================== Workbench ============================== */

function Workbench({
  project,
  onBack,
  notify,
  annotations,
  setAnnotations,
  onInviteSent,
  modelProps,
  setModelProps,
}: any) {
  const [activeTool, setActiveTool] = useState("select");
  const [activeRibbonTab, setActiveRibbonTab] = useState("HOME");
  const [viewerCommand, setViewerCommand] = useState<{
    id: number;
    type: string;
  }>({ id: 0, type: "" });

  const sendViewerCommand = (type: string) => {
    setViewerCommand({ id: Date.now(), type });
  };
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", user: "System", text: "Live Session Started", time: "Just now" },
  ]);
  const [activeTab, setActiveTab] = useState<"chat" | "issues">("chat");

  const triggerExport = () => {
    notify(`Successfully exported ${project.name}_FINAL.step`);
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
      <header className="wb-topbar">
        <div className="topbar-left">
          <div className="menu-icon" onClick={onBack} title="Return to Hub">
            <Box size={16} />
          </div>
          <span className="menu-item">File</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">Render</span>
          <span className="menu-item">Window</span>
          <span className="menu-item">Help</span>
        </div>
        <div className="project-title">{project.name} - Blender 5.1.1</div>
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
            <span className="header-label">Mode</span>
            <div className="dropdown-mock">Object Mode</div>
          </div>
          <div className="ribbon-divider" />

          {activeRibbonTab === "HOME" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => sendViewerCommand("upload")}
                >
                  <Upload size={14} />
                  <span>Upload Model</span>
                </button>
                <button
                  className="ribbon-btn"
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
                  onClick={() => sendViewerCommand("move")}
                >
                  <Move size={14} />
                  <span>Move</span>
                </button>
                <button
                  className="ribbon-btn"
                  onClick={() => sendViewerCommand("rotate")}
                >
                  <RotateCw size={14} />
                  <span>Rotate</span>
                </button>
                <button
                  className="ribbon-btn"
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
                  onClick={() => sendViewerCommand("undo")}
                >
                  <Undo2 size={14} />
                  <span>Undo</span>
                </button>
                <button
                  className="ribbon-btn"
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
                  onClick={() => setActiveTool("pin")}
                >
                  <Pin size={14} />
                  <span>Annotation</span>
                </button>
                <button
                  className="ribbon-btn"
                  onClick={() =>
                    notify("Select a model point to add a dimension.", "info")
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
                  onClick={() => notify("Project Manager Opened", "info")}
                >
                  <Folder size={14} />
                  <span>Manager</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => {
                    setModelProps({
                      ...modelProps,
                      extraParts: modelProps.extraParts + 1,
                    });
                    notify("New Component Added", "success");
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
                  onClick={() => notify("Project Refreshed")}
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
                <button
                  className="ribbon-btn"
                  onClick={() => {
                    onInviteSent();
                  }}
                >
                  <Share2 size={14} />
                  <span>Share View</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => setActiveTab("chat")}
                >
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
                  onClick={() => notify("Exporting to Excel...")}
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
                  user: item.creator ?? item.user ?? "You",
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
              Issue Log
            </button>
          </div>
          <div className="panel-content">
            {activeTab === "chat" ? (
              <ChatPanel messages={messages} setMessages={setMessages} />
            ) : (
              <div className="issue-log">
                <div className="outliner-header">Pinned Errors</div>
                {annotations.length === 0 && (
                  <p className="empty-msg">No errors flagged.</p>
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

function ChatPanel({ messages, setMessages }: any) {
  const [input, setInput] = useState("");
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        user: "You",
        text: input,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInput("");
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
          placeholder="Message team..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================== CSS Styles ============================== */

const CSS = `
:root {
  --bg-dark: #141414;       
  --bg-panel: #1D1D1D;      
  --bg-raise: #2B2B2B;      
  --bg-viewport: #282828;   
  --accent: #4772B3;        
  --accent-cyan: rgba(64,232,244,1);
  --accent-orange: #FF7700; 
  --text-main: #E6E6E6;
  --text-dim: #999999;
  --border: #000000;        
  --border-light: #3E3E3E;  
  --btn-bg: #3E3E3E;
  --btn-hover: #545454;
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
.error-input-modal, .modal-card { width: 440px; background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden; animation: popIn 0.2s ease-out; }

@keyframes popIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header { background: var(--bg-raise); padding: 12px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 14px; font-weight: normal; }
.close-icon { cursor: pointer; color: var(--text-dim); transition: 0.1s; }
.close-icon:hover { color: white; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.modal-body label { font-size: 12px; color: var(--text-dim); }
.modal-body textarea { background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 4px; padding: 12px; color: white; font-family: inherit; font-size: 13px; resize: none; height: 100px; outline: none; }
.modal-body textarea:focus { border-color: var(--accent); }
.modal-body input.project-input { background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 4px; padding: 10px 12px; color: white; font-family: inherit; font-size: 13px; outline: none; }
.modal-body input.project-input:focus { border-color: var(--accent); }
.project-hint { margin: 4px 0 0; color: var(--text-dim); font-size: 11px; line-height: 1.4; }
.modal-footer { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-raise); }

/* HUB & NAVBAR */
.hub-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.hub-nav { height: 50px; background: var(--bg-raise); border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 20px; flex-shrink: 0; }
.logo { justify-self: start; display: flex; align-items: center; gap: 8px; font-weight: normal; font-size: 14px;}
.nav-links { justify-self: center; display: flex; gap: 20px; height: 100%; }
.nav-item { display: flex; align-items: center; gap: 6px; color: var(--text-dim); cursor: pointer; padding: 0 10px; border-bottom: 2px solid transparent; font-size: 13px; }
.nav-item:hover { color: var(--text-main); }
.nav-item.active { color: var(--text-main); border-bottom-color: var(--accent); }
.user-profile { justify-self: end; }

.hub-content { padding: 40px; overflow-y: auto; flex: 1; background: var(--bg-dark); display: flex; flex-direction: column; }
.hub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
.hub-header h1 { font-size: 20px; margin: 0 0 5px 0; font-weight: normal; }
.hub-header p { margin: 0; color: var(--text-dim); font-size: 13px; }

/* EMPTY STATE */
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 2px dashed var(--border-light); border-radius: 8px; background: rgba(255, 255, 255, 0.01); min-height: 400px; padding: 40px; }
.empty-icon { color: var(--text-dim); margin-bottom: 20px; background: var(--bg-raise); padding: 20px; border-radius: 50%; border: 1px solid var(--border-light); }
.empty-state h2 { margin: 0 0 10px 0; font-size: 18px; color: var(--text-main); font-weight: normal; }
.empty-state p { margin: 0 0 25px 0; color: var(--text-dim); font-size: 13px; max-width: 400px; line-height: 1.5; }

/* PROJECT GRID */
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.project-card { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 4px; cursor: pointer; transition: 0.15s; position: relative; }
.project-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.card-thumb { height: 130px; background: #000; display: flex; align-items: flex-end; padding: 12px; border-radius: 3px 3px 0 0; }
.thumb-label { font-size: 10px; background: var(--bg-raise); color: var(--text-main); padding: 3px 6px; border-radius: 2px; }
.card-info { padding: 15px; }
.card-info h3 { margin: 0; font-size: 14px; font-weight: normal; }
.card-info p { font-size: 12px; color: var(--text-dim); margin-top: 6px; }
.card-arrow { position: absolute; right: 15px; bottom: 15px; color: var(--text-dim); }

/* TEAM TABLE */
.team-table-container { background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 4px; }
.team-table { width: 100%; border-collapse: collapse; text-align: left; }
.team-table th { background: var(--bg-raise); padding: 12px 18px; font-weight: normal; color: var(--text-dim); border-bottom: 1px solid var(--border); font-size: 12px; }
.team-table td { padding: 15px 18px; border-bottom: 1px solid var(--border-light); font-size: 13px; }
.user-cell { display: flex; align-items: center; gap: 12px; }
.dim-text { color: var(--text-dim); }
.role-badge { padding: 3px 8px; border-radius: 3px; font-size: 11px; background: var(--bg-raise); text-transform: capitalize; color: #fff; }
.role-badge.owner { background: rgba(71, 114, 179, 0.4); border: 1px solid var(--accent); }
.status-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); }
.dot.online { background: var(--success); }

/* ACCOUNT SETTINGS SECTION */
.account-section { width: 100%; max-width: 800px; margin: 0 auto; padding: 10px 0; }
.account-header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(64,232,244,0.3); }
.account-header h1 { font-size: 24px; color: #ffffff; font-weight: 400; margin: 0 0 8px 0; }
.account-header p { color: var(--text-dim); margin: 0; font-size: 14px; }
.account-layout { display: flex; flex-direction: column; gap: 24px; }

.account-card-new { background: #000000; border: 1px solid rgba(64,232,244,0.35); border-radius: 8px; padding: 26px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); transition: box-shadow 0.3s ease; }
.account-card-new:hover { box-shadow: 0 8px 24px rgba(64,232,244,0.12); }
.account-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.account-card-header h3 { margin: 0; font-size: 17px; font-weight: 500; color: #ffffff; }
.account-card-body { display: flex; flex-direction: column; gap: 18px; }

.profile-identity-banner { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid #1a1a1a; margin-bottom: 4px; }
.avatar-large { width: 54px; height: 54px; border-radius: 50%; background: #1a1a1a; border: 1px solid rgba(64,232,244,0.5); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; color: var(--accent-cyan); }

.account-field-row { display: flex; flex-direction: column; gap: 8px; }
.account-field-row label { font-size: 12px; color: #aaaaaa; }
.account-field-row input, .account-select { background: #111111; border: 1px solid rgba(64,232,244,0.35); color: #ffffff; padding: 11px 14px; border-radius: 6px; font-size: 13px; outline: none; transition: 0.2s ease; }
.account-field-row input:focus, .account-select:focus { border-color: rgba(64,232,244,1); box-shadow: 0 0 0 2px rgba(64,232,244,0.15); }
.preference-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #0c0c0c; border: 1px solid #222; border-radius: 6px; }

/* WORKBENCH */
.workbench-view { display: flex; flex-direction: column; height: 100vh; background: var(--bg-dark); }
.wb-topbar { height: 30px; background: var(--bg-dark); display: flex; align-items: center; justify-content: space-between; padding: 0 10px; border-bottom: 1px solid var(--border); flex-shrink: 0; font-size: 12px;}
.topbar-left { display: flex; align-items: center; gap: 12px; }
.menu-icon { color: var(--text-main); cursor: pointer; opacity: 0.8; display: flex; align-items: center; }
.menu-icon:hover { opacity: 1; }
.menu-item { color: var(--text-main); cursor: pointer; padding: 4px 6px; border-radius: 3px; }
.menu-item:hover { background: rgba(255,255,255,0.1); }
.project-title { color: var(--text-dim); position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; pointer-events: none;}

/* RIBBON */
.autocad-ribbon { display: flex; flex-direction: column; flex-shrink: 0; }
.ribbon-tabs { display: flex; background: var(--bg-dark); padding-top: 4px; padding-left: 10px; gap: 2px; }
.ribbon-tab { padding: 6px 14px; color: var(--text-dim); cursor: pointer; border-radius: 4px 4px 0 0; font-size: 12px; }
.ribbon-tab:hover { color: var(--text-main); }
.ribbon-tab.active { background: var(--bg-raise); color: var(--text-main); }
.ribbon-toolbar { background: var(--bg-raise); min-height: 38px; padding: 0 10px; display: flex; align-items: center; overflow-x: auto; gap: 10px; border-bottom: 1px solid var(--border); }
.ribbon-toolbar-group { display: flex; align-items: center; gap: 8px; }
.header-label { color: var(--text-dim); font-size: 12px; }
.dropdown-mock { background: var(--bg-dark); border: 1px solid var(--border-light); padding: 4px 10px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; font-size: 12px; }
.ribbon-panel-group { display: flex; align-items: center; height: 100%; gap: 8px; }
.ribbon-col { display: flex; flex-direction: row; align-items: center; gap: 4px; }
.ribbon-btn { display: flex; flex-direction: row; align-items: center; background: transparent; border: 1px solid transparent; color: var(--text-main); cursor: pointer; border-radius: 3px; padding: 5px 8px; transition: 0.1s; }
.ribbon-btn span { margin-left: 6px; font-size: 12px; }
.ribbon-btn:hover { background: rgba(255,255,255,0.1); }
.ribbon-btn.active { background: var(--accent); color: white; }
.ribbon-divider { width: 1px; height: 18px; background: var(--border-light); margin: 0 6px; }

.wb-main { flex: 1; display: flex; overflow: hidden; }
.viewport-container { flex: 1; position: relative; background: var(--bg-viewport); display: flex; flex-direction: column; }
.collab-panel { width: 340px; background: var(--bg-panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0;}
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
.chat-input button { background: var(--btn-bg); border: 1px solid var(--border-light); color: white; padding: 6px 12px; margin-left: 8px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.chat-input button:hover { background: var(--btn-hover); }

.issue-log { padding: 12px; }
.outliner-header { background: var(--bg-raise); padding: 8px 12px; border-radius: 3px; margin-bottom: 10px; color: var(--text-main); display: flex; align-items: center; border: 1px solid var(--border-light); }
.issue-card { background: var(--bg-raise); border: 1px solid var(--border-light); border-left: 3px solid var(--accent-orange); padding: 10px 12px; border-radius: 3px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
.issue-user strong { color: var(--text-dim); font-weight: normal; }
.issue-text { color: var(--text-main); line-height: 1.4; }
.btn-resolve { align-self: flex-start; background: var(--bg-dark); border: 1px solid var(--border-light); color: var(--text-main); padding: 5px 10px; border-radius: 3px; cursor: pointer; transition: 0.1s; font-size: 12px; }
.btn-resolve:hover { background: var(--success); color: var(--bg-dark); border-color: var(--success); }
.empty-msg { color: var(--text-dim); padding: 15px; text-align: center; }

/* UTILS */
.btn-primary { background: var(--accent); color: white; border: none; padding: 8px 14px; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.15s; font-size: 13px; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--btn-bg); color: var(--text-main); border: 1px solid var(--border-light); padding: 8px 14px; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.15s; font-size: 13px; }
.btn-secondary:hover { background: var(--btn-hover); }
.avatar { width: 32px; height: 32px; background: #222; border: 1px solid var(--border-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: var(--accent-cyan); flex-shrink: 0; }
.avatar.small { width: 26px; height: 26px; font-size: 10px; }
.avatar.user-initials-avatar:hover { border-color: var(--accent-cyan); box-shadow: 0 0 8px rgba(64,232,244,0.3); }
`;