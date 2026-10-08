import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { projectsApi } from "../services/api";
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
  BoxSelect,
  Type,
  Ruler,
  Share2,
  FileUp,
  FileDown,
  X,
  Layers,
  Minus,
  Activity,
  Mail,
  HardDrive,
  Clock,
  User,
  Scissors,
  FolderPlus,
  RefreshCw,
  Cpu,
  Zap,
  Monitor,
  FileSpreadsheet,
  AlertTriangle,
  Table,
  Link,
  Package,
  Puzzle,
  MessageCircle,
  Store,
  Folder,
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

/* ============================== Main Application ============================== */

export default function ProfessionalCADApp() {
  const [currentView, setCurrentView] = useState<View>("HUB");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 3D Model State
  const [modelProps, setModelProps] = useState<ModelProps>({
    wireframe: false,
    scale: 1,
    color: 0x808080, // Default Blender Grey
    extraParts: 0,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "me",
      name: "My Account (You)",
      email: "admin@workbench.cloud",
      role: "Owner",
      joinedAt: new Date().toLocaleString(),
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
    type: "success" | "info" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load real projects from the backend when the dashboard opens.
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsApi.list();

        // Support either a direct array response or { projects: [...] }.
        const backendProjects = Array.isArray(response)
          ? response
          : ((response as any)?.projects ?? []);

        const formattedProjects: Project[] = backendProjects.map((p: any) => ({
          id: String(p.project_id ?? p.id),
          name: p.project_name ?? p.name ?? "Untitled Project",
          date: p.created_at
            ? new Date(p.created_at).toLocaleDateString()
            : "Recently created",
          collaborators: ["You"],
          fileType: "CAD",
        }));

        setProjects(formattedProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
        showNotify("Failed to load projects from server", "info");
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("#project/")) {
      const projectId = hash.split("#project/")[1];
      const mockProject: Project = {
        id: projectId,
        name: "Collaborative Assembly",
        date: "Joined via Link",
        collaborators: ["Lead Designer", "You"],
        fileType: "STEP",
      };
      setSelectedProject(mockProject);
      setCurrentView("WORKBENCH");
    }
  }, []);

  const handleImport = async (projectName: string, description: string) => {
    if (!projectName.trim()) return;

    try {
      const token = (() => {
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          const value = localStorage.getItem(key);
          if (value && value.split(".").length === 3) return value;
          try {
            const parsed = value ? JSON.parse(value) : null;
            if (parsed?.token) return parsed.token;
          } catch {}
        }
        return null;
      })();

      const response = await fetch("http://localhost:5000/api/projects", {
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
      if (!response.ok)
        throw new Error(data.message || "Could not create project");

      const p = data.project;
      const newProject: Project = {
        id: String(p.project_id ?? p.id),
        name: p.project_name ?? projectName.trim(),
        date: p.created_at
          ? new Date(p.created_at).toLocaleDateString()
          : new Date().toLocaleDateString(),
        collaborators: ["You"],
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
        "info",
      );
    }
  };

  const simulateInviteAcceptance = () => {
    const mockUsers = [
      { name: "Alex Carter", email: "alex.c@design.co", role: "Editor" },
      { name: "David Kim", email: "dkim@structurals.net", role: "Editor" },
    ];
    setTimeout(() => {
      const randomUser =
        mockUsers[Math.floor(Math.random() * mockUsers.length)];
      setTeamMembers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: randomUser.name,
          email: randomUser.email,
          role: randomUser.role,
          joinedAt: new Date().toLocaleString(),
          status: "Online",
        },
      ]);
      showNotify(`${randomUser.name} joined the workspace!`, "success");
    }, 3500);
  };

  const handleSaveAnnotation = () => {
    if (!errorText.trim()) return;
    setAllAnnotations([
      ...allAnnotations,
      {
        id: Date.now().toString(),
        position: pendingAnnotation?.pos || [0, 0, 0],
        text: errorText,
        user: "You",
        resolved: false,
      },
    ]);
    setIsErrorModalOpen(false);
    setErrorText("");
    setPendingAnnotation(null);
    showNotify("Error pinned to model");
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
          onOpenProject={(p: Project) => {
            setSelectedProject(p);
            setCurrentView("WORKBENCH");
          }}
          onImportClick={() => setIsImportModalOpen(true)}
          onInviteSent={() => {
            showNotify(`Invite link generated and copied!`, "info");
            simulateInviteAcceptance();
          }}
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
          onInviteSent={simulateInviteAcceptance}
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
  onOpenProject,
  onImportClick,
  onInviteSent,
}: any) {
  const [activeTab, setActiveTab] = useState<HubTab>("projects");

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
          <div className="avatar">ME</div>
        </div>
      </nav>

      <main className="hub-content">
        {activeTab === "projects" && (
          <>
            <header className="hub-header">
              <div>
                <h1>Design Workspace</h1>
                <p>
                  Collaborate on high-precision CAD assemblies in real-time.
                </p>
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
                          {member.name.charAt(0)}
                        </div>
                        <span style={{ color: "#fff" }}>{member.name}</span>
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

        {activeTab === "account" && (
          <div className="tab-section account-section">
            <header className="account-header">
              <h1>Account Settings</h1>
              <p>Manage your login details and workspace preferences.</p>
            </header>

            <div className="account-layout">
              <div className="account-card-new">
                <div className="account-card-header">
                  <User size={20} color="rgba(64,232,244,1)" />
                  <h3>Profile Details</h3>
                </div>
                <div className="account-card-body">
                  <div className="account-field-row">
                    <label>Email Address</label>
                    <input type="text" value="admin@workbench.cloud" readOnly />
                  </div>
                  <div className="account-field-row">
                    <label>Account Role</label>
                    <input type="text" value="Workspace Owner" readOnly />
                  </div>
                </div>
              </div>

              <div className="account-card-new">
                <div className="account-card-header">
                  <HardDrive size={20} color="rgba(64,232,244,1)" />
                  <h3>Storage Usage</h3>
                </div>
                <div className="account-card-body">
                  <div className="storage-info-new">
                    <span className="storage-used">1.2 GB used</span>
                    <span className="storage-total">10 GB total</span>
                  </div>
                  <div className="storage-bar-bg">
                    <div
                      className="storage-bar-fill"
                      style={{ width: "12%" }}
                    ></div>
                  </div>
                  <p className="storage-desc-new">
                    You have plenty of space left for new high-precision CAD
                    assemblies and reports.
                  </p>
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
            Create the project first. You can upload the 3D model from the
            Workbench.
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
  openErrorModal,
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

          {activeRibbonTab === "SCHEMATIC" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <Cpu size={14} />
                  <span>Insert Comp</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className={`ribbon-btn ${modelProps.wireframe ? "active" : ""}`}
                  onClick={() =>
                    setModelProps({
                      ...modelProps,
                      wireframe: !modelProps.wireframe,
                    })
                  }
                >
                  <Zap size={14} />
                  <span>Wireframe</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <Scissors size={14} />
                  <span>Trim Wire</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "PANEL" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <BoxSelect size={14} />
                  <span>Terminal</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() =>
                    setModelProps({
                      ...modelProps,
                      color:
                        modelProps.color === 0x808080 ? 0x2a5b75 : 0x808080,
                    })
                  }
                >
                  <Monitor size={14} />
                  <span>Set Color</span>
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
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <FileUp size={14} />
                  <span>Import Data</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "ELECTROMECHANICAL" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() =>
                    notify("Syncing with Autodesk Inventor...", "info")
                  }
                >
                  <Link size={14} />
                  <span>Sync Setup</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "CONVERSION TOOLS" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <Package size={14} />
                  <span>To Block</span>
                </button>
              </div>
              <div className="ribbon-divider" />
              <div className="ribbon-col">
                <button
                  className={`ribbon-btn ${modelProps.scale > 1 ? "active" : ""}`}
                  onClick={() =>
                    setModelProps({
                      ...modelProps,
                      scale: modelProps.scale === 1 ? 1.5 : 1,
                    })
                  }
                >
                  <Maximize size={14} />
                  <span>Scale 1.5x</span>
                </button>
              </div>
            </div>
          )}

          {activeRibbonTab === "ADD-INS" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button
                  className="ribbon-btn"
                  onClick={() => notify("Opening Plugin Manager")}
                >
                  <Puzzle size={14} />
                  <span>Manage Plugins</span>
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
                    notify("Invite link generated!", "success");
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

          {activeRibbonTab === "FEATURED APPS" && (
            <div className="ribbon-panel-group">
              <div className="ribbon-col">
                <button className="ribbon-btn">
                  <Store size={14} />
                  <span>App Store</span>
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
                })),
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
                        setAnnotations((current) =>
                          current.filter((ann: Annotation) => ann.id !== a.id),
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
              <strong>{m.user}</strong>{" "}
              <span className="msg-time">{m.time}</span>
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

/* ============================== 3D Viewport ============================== */

function Viewport({ activeTool, modelProps, onAddAnnotation }: any) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const edgesRef = useRef<THREE.LineSegments | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x282828); // Blender Viewport BG

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight,
    );
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();

    // Create the Blender Default Cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.1,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(geometry, mat);

    // Add Blender's Orange Selection Outline
    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const edges = new THREE.LineSegments(
      edgesGeo,
      new THREE.LineBasicMaterial({ color: 0xff7700, linewidth: 2 }),
    );
    body.add(edges);

    group.add(body);
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 7);
    scene.add(light);

    // Blender-like Grid
    const grid = new THREE.GridHelper(40, 40, 0x555555, 0x3a3a3a);
    scene.add(grid);

    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);

    matRef.current = mat;
    groupRef.current = group;
    sceneRef.current = scene;
    edgesRef.current = edges;

    const animate = () => {
      requestAnimationFrame(animate);
      if (groupRef.current) groupRef.current.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseDown = () => {
      if (activeTool === "pin") onAddAnnotation([0, 0, 0]);
    };
    renderer.domElement.addEventListener("mousedown", handleMouseDown);

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeTool, onAddAnnotation]);

  useEffect(() => {
    if (matRef.current) {
      matRef.current.wireframe = modelProps.wireframe;
      matRef.current.color.setHex(modelProps.color);
    }
    if (edgesRef.current) {
      edgesRef.current.visible = !modelProps.wireframe;
    }
    if (groupRef.current) {
      const s = modelProps.scale;
      groupRef.current.scale.set(s, s, s);

      if (modelProps.extraParts > groupRef.current.children.length - 1) {
        const extraMat = new THREE.MeshStandardMaterial({
          color: 0x4772b3,
          metalness: 0.2,
        });
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.8, 0.8),
          extraMat,
        );
        box.position.set(
          Math.random() * 4 - 2,
          Math.random() * 2,
          Math.random() * 4 - 2,
        );

        const extraEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(box.geometry),
          new THREE.LineBasicMaterial({ color: 0xff7700 }),
        );
        box.add(extraEdges);

        groupRef.current.add(box);
      }
    }
  }, [modelProps]);

  return (
    <div className="viewport-wrapper" ref={mountRef}>
      <div className="viewport-ui">
        <div className="coord-box">
          User Perspective
          <br />
          (1) Collection | Cube
        </div>
      </div>
    </div>
  );
}

/* ============================== CSS ============================== */

const CSS = `
:root {
  /* Blender 5.1.1 Dark Theme Colors */
  --bg-dark: #141414;       
  --bg-panel: #1D1D1D;      
  --bg-raise: #2B2B2B;      
  --bg-viewport: #282828;   
  
  --accent: #4772B3;        
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
.notification-toast { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); z-index: 99999; background: var(--bg-raise); border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 4px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
.notification-toast.success { border-left: 3px solid var(--success); }
.notification-toast.info { border-left: 3px solid var(--accent); }
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

/* UPLOAD ZONE IMPROVEMENTS */
.upload-zone { border: 2px dashed var(--border-light); background: rgba(0,0,0,0.2); border-radius: 6px; padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-dim); position: relative; transition: 0.2s; }
.upload-zone:hover { border-color: var(--accent); background: rgba(71, 114, 179, 0.05); }
.upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; z-index: 10; }
.file-selected { margin-top: 15px; background: rgba(71, 114, 179, 0.2); border: 1px solid var(--accent); color: white; padding: 6px 12px; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; width: 100%; z-index: 11; }

/* HUB & TABS */
.hub-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.hub-nav { height: 50px; background: var(--bg-raise); border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 20px; flex-shrink: 0; }
.logo { justify-self: start; display: flex; align-items: center; gap: 8px; font-weight: normal; font-size: 14px;}
.nav-links { justify-self: center; display: flex; gap: 20px; height: 100%; }
.nav-item { display: flex; align-items: center; gap: 6px; color: var(--text-dim); cursor: pointer; padding: 0 10px; border-bottom: 2px solid transparent; }
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
.team-table td { padding: 15px 18px; border-bottom: 1px solid var(--border-light); }
.user-cell { display: flex; align-items: center; gap: 12px; }
.dim-text { color: var(--text-dim); }
.role-badge { padding: 3px 8px; border-radius: 3px; font-size: 11px; background: var(--bg-raise); }
.status-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); }
.dot.online { background: var(--success); }

/* ========================================= */
/* ACCOUNT SETTINGS SECTION (CYAN & BLACK)   */
/* ========================================= */
.account-section {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.account-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(64,232,244,0.4);
}

.account-header h1 {
  font-size: 24px;
  color: #ffffff;
  font-weight: 400;
  margin: 0 0 8px 0;
}

.account-header p {
  color: var(--text-dim);
  margin: 0;
  font-size: 14px;
}

.account-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-card-new {
  background: #000000;
  border: 1px solid rgba(64,232,244,0.4);
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.3s ease;
}

.account-card-new:hover {
  box-shadow: 0 8px 24px rgba(64,232,244,0.1);
}

.account-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.account-card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
}

.account-card-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.account-field-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-field-row label {
  font-size: 13px;
  color: #aaaaaa;
  letter-spacing: 0.5px;
}

.account-field-row input {
  background: #111111;
  border: 1px solid rgba(64,232,244,0.4);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.account-field-row input:focus {
  border-color: rgba(64,232,244,1);
  box-shadow: 0 0 0 2px rgba(64,232,244,0.2);
}

.storage-info-new {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #ffffff;
  margin-bottom: 8px;
}

.storage-used {
  color: rgba(64,232,244,1);
  font-weight: 500;
}

.storage-total {
  color: #888888;
}

.storage-bar-bg {
  width: 100%;
  height: 12px;
  background: #111111;
  border: 1px solid rgba(64,232,244,0.2);
  border-radius: 6px;
  overflow: hidden;
}

.storage-bar-fill {
  height: 100%;
  background: rgba(64,232,244,0.4);
  border-radius: 6px;
  transition: width 1s ease-in-out;
}

.storage-desc-new {
  font-size: 13px;
  color: #aaaaaa;
  margin-top: 12px;
  line-height: 1.5;
}

/* WORKBENCH (Blender specific styling) */
.workbench-view { display: flex; flex-direction: column; height: 100vh; background: var(--bg-dark); }
.wb-topbar { height: 30px; background: var(--bg-dark); display: flex; align-items: center; justify-content: space-between; padding: 0 10px; border-bottom: 1px solid var(--border); flex-shrink: 0; font-size: 12px;}
.topbar-left { display: flex; align-items: center; gap: 12px; }
.menu-icon { color: var(--text-main); cursor: pointer; opacity: 0.8; display: flex; align-items: center; }
.menu-icon:hover { opacity: 1; }
.menu-item { color: var(--text-main); cursor: pointer; padding: 4px 6px; border-radius: 3px; }
.menu-item:hover { background: rgba(255,255,255,0.1); }
.project-title { color: var(--text-dim); position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; pointer-events: none;}

/* HEADER TRANSLATION */
.autocad-ribbon { display: flex; flex-direction: column; flex-shrink: 0; }
.ribbon-tabs { display: flex; background: var(--bg-dark); padding-top: 4px; padding-left: 10px; gap: 2px; }
.ribbon-tab { padding: 6px 14px; color: var(--text-dim); cursor: pointer; border-radius: 4px 4px 0 0; font-size: 12px; }
.ribbon-tab:hover { color: var(--text-main); }
.ribbon-tab.active { background: var(--bg-raise); color: var(--text-main); }
.ribbon-toolbar { background: var(--bg-raise); min-height: 38px; padding: 0 10px; display: flex; align-items: center; overflow-x: auto; gap: 10px; border-bottom: 1px solid var(--border); }
.ribbon-toolbar::-webkit-scrollbar { height: 0; }
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

/* VIEWPORT */
.viewport-container { flex: 1; position: relative; background: var(--bg-viewport); display: flex; flex-direction: column; }
.viewport-wrapper { width: 100%; height: 100%; }
.viewport-ui { position: absolute; top: 15px; left: 15px; pointer-events: none; }
.coord-box { color: var(--text-main); text-shadow: 1px 1px 2px rgba(0,0,0,0.8); font-size: 12px; line-height: 1.5; }

/* RIGHT PANEL */
.collab-panel { width: 340px; background: var(--bg-panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0;}
.panel-tabs { display: flex; background: var(--bg-raise); border-bottom: 1px solid var(--border); }
.tab { flex: 1; padding: 10px; background: transparent; border: none; color: var(--text-dim); cursor: pointer; font-size: 12px; border-bottom: 2px solid transparent; }
.tab:hover { color: var(--text-main); }
.tab.active { color: var(--text-main); border-bottom: 2px solid var(--accent); }
.panel-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

/* Chat Box */
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

/* Issue Log */
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
.avatar { width: 30px; height: 30px; background: var(--btn-bg); border: 1px solid var(--border-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--text-main); flex-shrink: 0; }
.avatar.small { width: 26px; height: 26px; }
`;
