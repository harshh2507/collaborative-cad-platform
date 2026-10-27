import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Canvas, useThree } from "@react-three/fiber";

import * as THREE from "three";
import { DoubleSide } from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import {
  OrbitControls,
  Grid,
  Html,
  GizmoHelper,
  GizmoViewport,
  TransformControls,
} from "@react-three/drei";

const buttonStyle = {
  width: "100%",

  padding: "12px",

  color: "white",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer",

  fontWeight: "bold",

  fontSize: "15px",
};

const transformButtonStyle = {
  padding: "10px 16px",

  marginRight: "8px",

  color: "white",

  background: "#374151",

  border: "1px solid #64748b",

  borderRadius: "6px",

  cursor: "pointer",

  fontWeight: "bold",
};

const primitiveNames = {
  cube: "Cube",

  cylinder: "Cylinder",

  sphere: "Sphere",

  cone: "Cone",

  torus: "Torus",
};

function UploadedModel({ url, fileType, onClick }) {
  const [object, setObject] = useState(null);

  useEffect(() => {
    if (!url || !fileType) {
      setObject(null);
      return;
    }

    let loader;

    if (fileType === "gltf" || fileType === "glb") {
      loader = new GLTFLoader();

      loader.load(
        url,
        (result) => {
          setObject(result.scene);
        },
        undefined,
        (error) => {
          console.error("GLTF/GLB loading error:", error);
        },
      );
    } else if (fileType === "obj") {
      loader = new OBJLoader();

      loader.load(
        url,
        (result) => {
          setObject(result);
        },
        undefined,
        (error) => {
          console.error("OBJ loading error:", error);
        },
      );
    } else if (fileType === "fbx") {
      loader = new FBXLoader();

      loader.load(
        url,
        (result) => {
          setObject(result);
        },
        undefined,
        (error) => {
          console.error("FBX loading error:", error);
        },
      );
    } else if (fileType === "stl") {
      loader = new STLLoader();

      loader.load(
        url,
        (geometry) => {
          geometry.computeVertexNormals();

          const material = new THREE.MeshStandardMaterial({
            color: "#9ca3af",
            side: THREE.DoubleSide,
          });

          setObject(new THREE.Mesh(geometry, material));
        },
        undefined,
        (error) => {
          console.error("STL loading error:", error);
        },
      );
    } else if (fileType === "ply") {
      loader = new PLYLoader();

      loader.load(
        url,
        (geometry) => {
          geometry.computeVertexNormals();

          const material = new THREE.MeshStandardMaterial({
            color: "#9ca3af",
            side: THREE.DoubleSide,
          });

          setObject(new THREE.Mesh(geometry, material));
        },
        undefined,
        (error) => {
          console.error("PLY loading error:", error);
        },
      );
    }

    return () => {
      setObject(null);
    };
  }, [url, fileType]);

  if (!object) return null;

  return <primitive object={object} onClick={onClick} />;
}

function AnnotationPin({ position, onRemove, text }) {
  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ff4d6d" />
      </mesh>
      {text && (
        <Html
          position={[0.08, 0.08, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              color: "#ffffff",
              background: "rgba(8,10,14,0.92)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 5,
              padding: "4px 7px",
              fontSize: 12,
              whiteSpace: "nowrap",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              boxShadow: "0 3px 12px rgba(0,0,0,.35)",
            }}
          >
            {text}
          </div>
        </Html>
      )}
    </group>
  );
}

function PrimitiveMesh({ type, onClick }) {
  if (type === "cube") {
    return (
      <mesh position={[0, 1, 0]} onClick={onClick}>
        <boxGeometry args={[2, 2, 2]} />

        <meshStandardMaterial color="#f97316" />
      </mesh>
    );
  }

  if (type === "cylinder") {
    return (
      <mesh position={[0, 1, 0]} onClick={onClick}>
        <cylinderGeometry args={[1, 1, 2, 32]} />

        <meshStandardMaterial color="#22c55e" />
      </mesh>
    );
  }

  if (type === "sphere") {
    return (
      <mesh position={[0, 1, 0]} onClick={onClick}>
        <sphereGeometry args={[1, 32, 32]} />

        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    );
  }

  if (type === "cone") {
    return (
      <mesh position={[0, 1, 0]} onClick={onClick}>
        <coneGeometry args={[1, 2, 32]} />

        <meshStandardMaterial color="#a855f7" />
      </mesh>
    );
  }

  return (
    <mesh position={[0, 1, 0]} onClick={onClick}>
      <torusGeometry args={[1, 0.35, 16, 32]} />

      <meshStandardMaterial color="#eab308" />
    </mesh>
  );
}

function SelectablePrimitive({
  object,

  selectedObjectId,

  setSelectedObjectId,

  primitiveGroupRefs,

  handlePrimitiveClick,

  annotations,

  removeAnnotation,
}) {
  const isSelected = selectedObjectId === object.id;

  function handleSelect(event) {
    event.stopPropagation();

    setSelectedObjectId(object.id);

    if (!object.locked && !isSelected && !event.nativeEvent?.shiftKey) {
      handlePrimitiveClick(event, object.id);
    }
  }

  return (
    <group
      visible={object.visible !== false}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      ref={(group) => {
        if (group) primitiveGroupRefs.current[object.id] = group;
        else delete primitiveGroupRefs.current[object.id];
      }}
    >
      <PrimitiveMesh type={object.type} onClick={handleSelect} />

      {annotations

        .filter((annotation) => annotation.objectId === object.id)

        .map((annotation) => (
          <AnnotationPin
            key={annotation.id}
            position={annotation.position}
            text={annotation.comment || annotation.title}
            onRemove={() => removeAnnotation(annotation.id)}
          />
        ))}
    </group>
  );
}

function makeInitialScene() {
  return {
    model: null,

    primitives: [],

    annotations: [],
  };
}

function CollaborativeCamera({
  followUserId,

  remoteCamerasRef,

  broadcastMessage,

  isTransforming,
}) {
  const { camera } = useThree();

  const controlsRef = useRef(null);

  function getCameraState() {
    const controls = controlsRef.current;

    return {
      position: [camera.position.x, camera.position.y, camera.position.z],

      target: controls
        ? [controls.target.x, controls.target.y, controls.target.z]
        : [0, 0, 0],
    };
  }

  useEffect(() => {
    const sendCamera = () => {
      if (!isTransforming && !followUserId) {
        broadcastMessage({
          type: "camera",

          camera: getCameraState(),

          updatedAt: Date.now(),
        });
      }
    };

    sendCamera();

    const interval = setInterval(sendCamera, 100);

    return () => clearInterval(interval);
  }, [broadcastMessage, followUserId, isTransforming]);

  useEffect(() => {
    if (!followUserId) return undefined;

    const followCamera = () => {
      const remote = remoteCamerasRef.current[followUserId];

      if (!remote) return;

      camera.position.set(...remote.position);

      if (controlsRef.current && remote.target) {
        controlsRef.current.target.set(...remote.target);

        controlsRef.current.update();
      }
    };

    followCamera();

    const interval = setInterval(followCamera, 100);

    return () => clearInterval(interval);
  }, [camera, followUserId, remoteCamerasRef]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!isTransforming}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      panSpeed={1.2}
      screenSpacePanning
      mouseButtons={{ LEFT: 0, MIDDLE: 1, RIGHT: 2 }}
      onChange={() => {
        if (!isTransforming && !followUserId) {
          broadcastMessage({
            type: "camera",

            camera: getCameraState(),

            updatedAt: Date.now(),
          });
        }
      }}
    />
  );
}

function ThreeDViewer({
  projectId,
  onAnnotationsChange,
  onModelUploaded,
  viewerCommand,
} = {}) {
  const API_BASE = "http://localhost:5000";

  function getAuthToken() {
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
  }

  async function apiRequest(path, options = {}) {
    const token = getAuthToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }

  function backendFileUrl(filePath) {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const normalized = String(filePath)
      .replaceAll("\\", "/")
      .replace(/^\/+/, "");
    const uploadsIndex = normalized.indexOf("uploads/");
    return uploadsIndex >= 0
      ? `${API_BASE}/${normalized.slice(uploadsIndex)}`
      : `${API_BASE}/uploads/${normalized.split("/").pop()}`;
  }

  const [transformMode, setTransformMode] = useState("translate");

  const [isTransforming, setIsTransforming] = useState(false);

  const [showPrimitiveMenu, setShowPrimitiveMenu] = useState(false);

  const uploadInputRef = useRef(null);

  const [sceneState, setSceneState] = useState(makeInitialScene);

  const [selectedObjectId, setSelectedObjectId] = useState(null);

  const [transformTarget, setTransformTarget] = useState(null);

  const [selectedId, setSelectedId] = useState(null);

  const [comment, setComment] = useState("");

  const [annotationTitle, setAnnotationTitle] = useState("");

  const [annotationStatus, setAnnotationStatus] = useState("Open");

  const [showCommentBox, setShowCommentBox] = useState(false);

  const [editingAnnotationId, setEditingAnnotationId] = useState(null);

  const [treeOpen, setTreeOpen] = useState(true);

  const [presenceOpen, setPresenceOpen] = useState(false);

  const [userName, setUserName] = useState(
    () => `User-${Math.floor(Math.random() * 900 + 100)}`,
  );

  useEffect(() => {
    if (!viewerCommand?.id) return;

    switch (viewerCommand.type) {
      case "upload":
        uploadInputRef.current?.click();
        break;
      case "move":
        setTransformMode("translate");
        break;
      case "rotate":
        setTransformMode("rotate");
        break;
      case "scale":
        setTransformMode("scale");
        break;
      case "undo":
        handleUndo();
        break;
      case "redo":
        handleRedo();
        break;
      case "primitive":
        setShowPrimitiveMenu((value) => !value);
        break;
      case "remove-annotation":
        setSceneState((current) => ({
          ...current,
          annotations: current.annotations.filter(
            (annotation) => String(annotation.id) !== String(viewerCommand.id),
          ),
        }));

        setSelectedId(null);
        setShowCommentBox(false);
        setEditingAnnotationId(null);
        break;
      default:
        break;
    }
  }, [viewerCommand?.id]);

  const [presence, setPresence] = useState([]);

  const [past, setPast] = useState([]);

  const [future, setFuture] = useState([]);

  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

  const [followUserId, setFollowUserId] = useState(null);

  const [followMenuOpen, setFollowMenuOpen] = useState(false);

  const modelGroupRef = useRef(null);

  const primitiveGroupRefs = useRef({});

  const wsRef = useRef(null);

  const remoteCamerasRef = useRef({});

  // Object currently being transformed by this browser. Remote transform

  // packets for this object are ignored until the local drag ends so another

  // user cannot visually fight with the local TransformControls.

  const activeTransformObjectRef = useRef(null);

  // Lamport-style logical clock. Date.now() is unsafe for collaboration

  // because different computers can have different system clocks.

  const logicalClockRef = useRef(0);

  // Newest logical transform version received for each object.

  const transformVersionsRef = useRef({});

  // Always expose the latest scene to the WebSocket handler.

  const sceneStateRef = useRef(sceneState);

  sceneStateRef.current = sceneState;

  const clientId = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,

    [],
  );

  const modelUrl = sceneState.model?.url || null;

  const modelName = sceneState.model?.name || "";

  const primitiveObjects = sceneState.primitives;

  const annotations = sceneState.annotations;

  useEffect(() => {
    onAnnotationsChange?.(annotations);
  }, [annotations, onAnnotationsChange]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    async function loadBackendScene() {
      try {
        const modelResponse = await apiRequest(
          `/api/projects/${projectId}/models`,
        );
        const models = modelResponse.models || [];
        if (!models.length || cancelled) return;

        const model = models[models.length - 1];
        const versionsResponse = await apiRequest(
          `/api/projects/${projectId}/models/${model.model_id}/versions`,
        );
        const versions = versionsResponse.versions || [];
        if (!versions.length || cancelled) return;

        const version = versions[versions.length - 1];
        const annotationResponse = await apiRequest(
          `/api/projects/${projectId}/models/${model.model_id}/versions/${version.version_id}/annotations`,
        );

        const extension =
          String(model.file_name || "")
            .split(".")
            .pop()
            ?.toLowerCase() || "glb";
        const loadedAnnotations = (annotationResponse.annotations || []).map(
          (item) => ({
            id: item.annotation_id,
            objectId: "uploaded-model",
            position: [Number(item.x), Number(item.y), Number(item.z)],
            title: "",
            comment: item.comment || "",
            status:
              item.status === "in_progress"
                ? "In Progress"
                : item.status === "resolved"
                  ? "Resolved"
                  : "Open",
            creator: item.user_name || item.name || `User ${item.user_id}`,
            createdAt: item.created_at,
            backendId: item.annotation_id,
          }),
        );

        if (!cancelled) {
          setSceneState((current) => ({
            ...current,
            model: {
              id: "uploaded-model",
              name: model.file_name,
              url: backendFileUrl(version.file_path || model.file_path),
              fileType: extension,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              visible: true,
              locked: false,
              backendModelId: model.model_id,
              backendVersionId: version.version_id,
            },
            annotations: loadedAnnotations,
          }));
          setSelectedObjectId("uploaded-model");
        }
      } catch (error) {
        console.error("Failed to load backend model/annotations:", error);
      }
    }

    loadBackendScene();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Keep one TransformControls instance attached to the currently selected

  // Three.js object. Using a single controller prevents local drag handling

  // from being recreated when collaborative state arrives from another tab.

  useEffect(() => {
    if (selectedObjectId === "uploaded-model") {
      setTransformTarget(modelGroupRef.current || null);

      return;
    }

    if (selectedObjectId) {
      setTransformTarget(primitiveGroupRefs.current[selectedObjectId] || null);

      return;
    }

    setTransformTarget(null);
  }, [selectedObjectId, sceneState.model, sceneState.primitives]);

  useEffect(() => {
    if (!selectedObjectId) return;

    const syncTarget = () => {
      const target =
        selectedObjectId === "uploaded-model"
          ? modelGroupRef.current
          : primitiveGroupRefs.current[selectedObjectId];

      setTransformTarget(target || null);
    };

    const frame = requestAnimationFrame(syncTarget);

    return () => cancelAnimationFrame(frame);
  }, [selectedObjectId, sceneState.model?.url, sceneState.primitives.length]);

  // TransformControls owns the live Three.js object, so apply collaborative

  // model transforms imperatively whenever the shared scene changes.

  useLayoutEffect(() => {
    const group = modelGroupRef.current;

    const model = sceneState.model;

    if (!group || !model) return;

    const position = model.position || [0, 0, 0];

    const rotation = model.rotation || [0, 0, 0];

    const scale = model.scale || [1, 1, 1];

    group.position.set(position[0], position[1], position[2]);

    group.rotation.set(rotation[0], rotation[1], rotation[2]);

    group.scale.set(scale[0], scale[1], scale[2]);

    group.updateMatrix();

    group.updateMatrixWorld(true);
  }, [
    sceneState.model?.position,

    sceneState.model?.rotation,

    sceneState.model?.scale,
  ]);

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applyScene(nextState, { history = true, broadcast = true } = {}) {
    if (history && !isRemoteUpdate) {
      setPast((previous) => [...previous.slice(-49), cloneState(sceneState)]);

      setFuture([]);
    }

    setSceneState(cloneState(nextState));

    if (broadcast) {
      broadcastMessage({
        type: "scene",

        scene: nextState,

        transformVersions: cloneState(transformVersionsRef.current),
      });
    }
  }

  function updateScene(updater, options) {
    const nextState = updater(cloneState(sceneState));

    applyScene(nextState, options);
  }

  function broadcastMessage(message) {
    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    try {
      socket.send(JSON.stringify({ ...message, sender: clientId }));
    } catch (error) {
      console.error("WebSocket send error:", error);
    }
  }

  function requestLatestScene() {
    broadcastMessage({ type: "scene-request" });
  }

  function broadcastTransform(objectId, group) {
    if (!group) return;

    console.log("SENDING TRANSFORM:", objectId, {
      position: [group.position.x, group.position.y, group.position.z],

      rotation: [group.rotation.x, group.rotation.y, group.rotation.z],

      scale: [group.scale.x, group.scale.y, group.scale.z],
    });

    logicalClockRef.current += 1;

    const version = logicalClockRef.current;

    transformVersionsRef.current[objectId] = version;

    broadcastMessage({
      type: "transform",

      objectId,

      version,

      transform: {
        position: [group.position.x, group.position.y, group.position.z],

        rotation: [group.rotation.x, group.rotation.y, group.rotation.z],

        scale: [group.scale.x, group.scale.y, group.scale.z],
      },
    });
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let reconnectTimer = null;

    let stopped = false;

    const roomId =
      new URLSearchParams(window.location.search).get("room") || "default-room";

    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8080`;

    function connect() {
      if (stopped) return;

      const socket = new WebSocket(wsUrl);

      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "hello",

            roomId,

            user: { id: clientId, name: userName },
          }),
        );
      };

      socket.onmessage = (event) => {
        let message;

        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!message || message.sender === clientId) return;

        if (message.type === "presence-list") {
          setPresence(Array.isArray(message.users) ? message.users : []);

          return;
        }

        if (message.type === "presence" && message.user) {
          setPresence((current) => {
            const filtered = current.filter(
              (person) => person.id !== message.user.id,
            );

            return [...filtered, message.user];
          });

          return;
        }

        if (message.type === "presence-remove") {
          setPresence((current) =>
            current.filter((person) => person.id !== message.userId),
          );

          return;
        }

        if (message.type === "camera" && message.camera) {
          remoteCamerasRef.current[message.sender] = message.camera;

          return;
        }

        if (message.type === "scene-request") {
          const latestScene = sceneStateRef.current;

          const hasScene =
            latestScene.model ||
            latestScene.primitives.length > 0 ||
            latestScene.annotations.length > 0;

          if (hasScene) {
            broadcastMessage({
              type: "scene",

              scene: latestScene,

              transformVersions: cloneState(transformVersionsRef.current),
            });
          }

          return;
        }

        if (
          (message.type === "scene" || message.type === "state-response") &&
          message.scene
        ) {
          const incomingScene = cloneState(message.scene);

          const incomingVersions = message.transformVersions || {};

          const currentScene = sceneStateRef.current;

          const currentVersions = transformVersionsRef.current;

          // Full-scene packets are used for additions/deletions/annotations.

          // Transform packets are authoritative for position/rotation/scale.

          // Therefore a stale scene snapshot must never move an object backward.

          const currentPrimitiveMap = new Map(
            (currentScene.primitives || []).map((object) => [
              String(object.id),

              object,
            ]),
          );

          incomingScene.primitives = (incomingScene.primitives || []).map(
            (object) => {
              const id = String(object.id);

              const current = currentPrimitiveMap.get(id);

              const incomingVersion = Number(incomingVersions[id] || 0);

              const currentVersion = Number(currentVersions[id] || 0);

              if (current && currentVersion > incomingVersion) {
                return {
                  ...object,

                  position: current.position,

                  rotation: current.rotation,

                  scale: current.scale,
                };
              }

              if (incomingVersion > 0) {
                currentVersions[id] = incomingVersion;

                logicalClockRef.current = Math.max(
                  logicalClockRef.current,

                  incomingVersion,
                );
              }

              return object;
            },
          );

          if (incomingScene.model) {
            const incomingVersion = Number(
              incomingVersions["uploaded-model"] || 0,
            );

            const currentVersion = Number(
              currentVersions["uploaded-model"] || 0,
            );

            if (currentScene.model && currentVersion > incomingVersion) {
              incomingScene.model = {
                ...incomingScene.model,

                position: currentScene.model.position,

                rotation: currentScene.model.rotation,

                scale: currentScene.model.scale,
              };
            } else if (incomingVersion > 0) {
              currentVersions["uploaded-model"] = incomingVersion;

              logicalClockRef.current = Math.max(
                logicalClockRef.current,

                incomingVersion,
              );
            }
          }

          setIsRemoteUpdate(true);

          setSceneState(incomingScene);

          setPast([]);

          setFuture([]);

          setIsRemoteUpdate(false);

          return;
        }

        if (
          message.type === "transform" &&
          message.objectId &&
          message.transform
        ) {
          if (activeTransformObjectRef.current === message.objectId) {
            return;
          }

          const incomingVersion = Number(message.version) || 0;

          const lastVersion =
            transformVersionsRef.current[message.objectId] || 0;

          if (incomingVersion > 0 && incomingVersion < lastVersion) return;

          logicalClockRef.current = Math.max(
            logicalClockRef.current,

            incomingVersion,
          );

          transformVersionsRef.current[message.objectId] =
            incomingVersion || lastVersion;

          setSceneState((current) => {
            if (message.objectId === "uploaded-model") {
              if (!current.model || current.model.locked) return current;

              return {
                ...current,

                model: { ...current.model, ...message.transform },
              };
            }

            return {
              ...current,

              primitives: current.primitives.map((object) =>
                String(object.id) === String(message.objectId) && !object.locked
                  ? { ...object, ...message.transform }
                  : object,
              ),
            };
          });

          return;
        }
      };

      socket.onerror = () => {};

      socket.onclose = () => {
        if (wsRef.current === socket) wsRef.current = null;

        if (!stopped) {
          reconnectTimer = setTimeout(connect, 1500);
        }
      };
    }

    connect();

    return () => {
      stopped = true;

      if (reconnectTimer) clearTimeout(reconnectTimer);

      if (wsRef.current) {
        wsRef.current.close();

        wsRef.current = null;
      }
    };
  }, [clientId, userName]);

  useEffect(() => {
    const sendPresence = () => {
      const user = {
        id: clientId,

        name: userName,

        lastSeen: Date.now(),
      };

      setPresence((current) => [
        ...current.filter((person) => person.id !== clientId),

        user,
      ]);

      broadcastMessage({ type: "presence", user });
    };

    sendPresence();

    const interval = setInterval(sendPresence, 5000);

    return () => clearInterval(interval);
  }, [clientId, userName]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - 12000;

      setPresence((current) =>
        current.filter(
          (person) => person.id === clientId || person.lastSeen > cutoff,
        ),
      );
    }, 4000);

    return () => clearInterval(cleanup);
  }, [clientId]);

  function handleUndo() {
    if (past.length === 0) return;

    const previous = past[past.length - 1];

    setPast((items) => items.slice(0, -1));

    setFuture((items) => [cloneState(sceneState), ...items].slice(0, 50));

    setSceneState(cloneState(previous));

    broadcastMessage({
      type: "scene",

      scene: previous,

      transformVersions: cloneState(transformVersionsRef.current),
    });
  }

  function handleRedo() {
    if (future.length === 0) return;

    const next = future[0];

    setFuture((items) => items.slice(1));

    setPast((items) => [...items.slice(-49), cloneState(sceneState)]);

    setSceneState(cloneState(next));

    broadcastMessage({
      type: "scene",

      scene: next,

      transformVersions: cloneState(transformVersionsRef.current),
    });
  }

  async function handleModelUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const supportedFormats = ["glb", "gltf", "obj", "fbx", "stl", "ply"];
    if (!extension || !supportedFormats.includes(extension)) {
      alert(
        "Unsupported file format. Please upload GLB, GLTF, OBJ, FBX, STL or PLY.",
      );
      event.target.value = "";
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const modelResponse = await apiRequest(
        `/api/projects/${projectId}/models`,
        {
          method: "POST",
          body: formData,
        },
      );

      const model = modelResponse.model;

      const versionForm = new FormData();
      versionForm.append("file", file);
      const versionResponse = await apiRequest(
        `/api/projects/${projectId}/models/${model.model_id}/versions`,
        { method: "POST", body: versionForm },
      );

      const version = versionResponse.version;
      const remoteUrl = backendFileUrl(version.file_path || model.file_path);

      updateScene((current) => ({
        ...current,
        model: {
          id: "uploaded-model",
          name: file.name,
          url: remoteUrl,
          fileType: extension,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          visible: true,
          locked: false,
          backendModelId: model.model_id,
          backendVersionId: version.version_id,
        },
        annotations: [],
      }));

      setShowPrimitiveMenu(false);
      setSelectedObjectId("uploaded-model");
      closeCommentBox();
      onModelUploaded?.(model);
    } catch (error) {
      console.error("Model upload failed:", error);
      alert(error.message || "Could not upload the model.");
    } finally {
      event.target.value = "";
    }
  }

  function handlePrimitiveSelect(type) {
    const newObject = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

      type,

      position: [0, 0, 0],

      rotation: [0, 0, 0],

      scale: [1, 1, 1],

      visible: true,

      locked: false,
    };

    updateScene((current) => ({
      ...current,

      primitives: [...current.primitives, newObject],
    }));

    setSelectedObjectId(newObject.id);

    setShowPrimitiveMenu(false);
  }

  function setActiveTransformObjectId(objectId) {
    activeTransformObjectRef.current = objectId;
  }

  function updateObjectTransform(objectId) {
    const group = primitiveGroupRefs.current[objectId];

    if (!group) return;

    const position = [group.position.x, group.position.y, group.position.z];

    const rotation = [group.rotation.x, group.rotation.y, group.rotation.z];

    const scale = [group.scale.x, group.scale.y, group.scale.z];

    updateScene(
      (current) => ({
        ...current,

        primitives: current.primitives.map((object) =>
          object.id === objectId
            ? { ...object, position, rotation, scale }
            : object,
        ),
      }),

      { broadcast: false },
    );

    // Live transform updates are already being sent by TransformControls.

    // Do not broadcast a stale full scene snapshot at drag end.

    broadcastTransform(objectId, group);
  }

  function updateModelTransform() {
    const group = modelGroupRef.current;

    if (!group || !sceneState.model) return;

    const position = [group.position.x, group.position.y, group.position.z];

    const rotation = [group.rotation.x, group.rotation.y, group.rotation.z];

    const scale = [group.scale.x, group.scale.y, group.scale.z];

    updateScene(
      (current) => ({
        ...current,

        model: current.model
          ? { ...current.model, position, rotation, scale }
          : null,
      }),

      { broadcast: false },
    );

    broadcastTransform("uploaded-model", group);
  }

  function handleModelClick(event) {
    event.stopPropagation();

    if (!modelGroupRef.current || isTransforming || sceneState.model?.locked)
      return;

    const localPosition = modelGroupRef.current.worldToLocal(
      event.point.clone(),
    );

    createAnnotation("uploaded-model", [
      localPosition.x,

      localPosition.y,

      localPosition.z,
    ]);

    setSelectedObjectId("uploaded-model");
  }

  function handlePrimitiveClick(event, objectId) {
    event.stopPropagation();

    const group = primitiveGroupRefs.current[objectId];

    const object = primitiveObjects.find((item) => item.id === objectId);

    if (!group || !object || isTransforming || object.locked) return;

    const localPosition = group.worldToLocal(event.point.clone());

    createAnnotation(objectId, [
      localPosition.x,

      localPosition.y,

      localPosition.z,
    ]);
  }

  function createAnnotation(objectId, position) {
    const annotation = {
      id: Date.now() + Math.random(),

      objectId,

      position,

      title: "",

      comment: "",

      status: "Open",

      creator: userName,

      createdAt: new Date().toISOString(),
    };

    updateScene((current) => ({
      ...current,

      annotations: [...current.annotations, annotation],
    }));

    setSelectedId(annotation.id);

    setAnnotationTitle("");

    setComment("");

    setAnnotationStatus("Open");

    setEditingAnnotationId(annotation.id);

    setShowCommentBox(true);
  }

  function handleAddAnnotation() {
    if (selectedObjectId) {
      const object = getObjectById(selectedObjectId);

      if (object?.locked) {
        alert("This object is locked.");

        return;
      }
    }

    if (annotations.length === 0) {
      alert("First click a point on the 3D model.");

      return;
    }

    setEditingAnnotationId(null);

    setSelectedId(annotations[annotations.length - 1].id);

    setShowCommentBox(true);

    loadAnnotationIntoForm(annotations[annotations.length - 1]);
  }

  function getObjectById(objectId) {
    if (objectId === "uploaded-model") return sceneState.model;

    return sceneState.primitives.find((object) => object.id === objectId);
  }

  function getObjectName(objectId) {
    if (objectId === "uploaded-model") return modelName || "Uploaded Model";

    const object = primitiveObjects.find((item) => item.id === objectId);

    return object
      ? primitiveNames[object.type] || object.type
      : "Unknown Object";
  }

  function loadAnnotationIntoForm(annotation) {
    setSelectedId(annotation.id);

    setAnnotationTitle(annotation.title || "");

    setComment(annotation.comment || "");

    setAnnotationStatus(annotation.status || "Open");
  }

  function handleSelectAnnotation(id) {
    const annotation = annotations.find(
      (item) => String(item.id) === String(id),
    );

    if (!annotation) return;

    loadAnnotationIntoForm(annotation);

    setEditingAnnotationId(annotation.id);
  }

  async function handleSaveComment() {
    if (selectedId === null) {
      alert("Select a pin from the dropdown.");
      return;
    }

    if (!comment.trim() && !annotationTitle.trim()) {
      alert("Please enter a title or comment.");
      return;
    }

    const text = comment.trim() || annotationTitle.trim();
    const localAnnotation = annotations.find(
      (annotation) => String(annotation.id) === String(selectedId),
    );
    if (!localAnnotation) return;

    try {
      let saved = null;
      if (
        projectId &&
        sceneState.model?.backendModelId &&
        sceneState.model?.backendVersionId &&
        !localAnnotation.backendId
      ) {
        const response = await apiRequest(
          `/api/projects/${projectId}/models/${sceneState.model.backendModelId}/versions/${sceneState.model.backendVersionId}/annotations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              x: Number(localAnnotation.position[0]),
              y: Number(localAnnotation.position[1]),
              z: Number(localAnnotation.position[2]),
              comment: text,
            }),
          },
        );
        saved = response.annotation;
      } else if (
        projectId &&
        sceneState.model?.backendModelId &&
        sceneState.model?.backendVersionId &&
        localAnnotation.backendId
      ) {
        const statusMap = {
          Open: "open",
          "In Progress": "in_progress",
          Resolved: "resolved",
        };
        const response = await apiRequest(
          `/api/projects/${projectId}/models/${sceneState.model.backendModelId}/versions/${sceneState.model.backendVersionId}/annotations/${localAnnotation.backendId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              comment: text,
              status: statusMap[annotationStatus] || "open",
            }),
          },
        );
        saved = response.annotation;
      }

      updateScene((current) => ({
        ...current,
        annotations: current.annotations.map((annotation) =>
          annotation.id === selectedId
            ? {
                ...annotation,
                id: saved?.annotation_id ?? annotation.id,
                backendId: saved?.annotation_id ?? annotation.backendId,
                title: annotationTitle.trim() || "Untitled Annotation",
                comment: text,
                status: annotationStatus,
                creator: annotation.creator || userName,
              }
            : annotation,
        ),
      }));

      closeCommentBox();
    } catch (error) {
      console.error("Annotation save failed:", error);
      alert(error.message || "Could not save annotation.");
    }
  }

  function removeAnnotation(id) {
    updateScene((current) => ({
      ...current,

      annotations: current.annotations.filter(
        (annotation) => annotation.id !== id,
      ),
    }));

    if (selectedId === id) closeCommentBox();
  }

  function clearAnnotations() {
    updateScene((current) => ({ ...current, annotations: [] }));

    closeCommentBox();
  }

  function closeCommentBox() {
    setSelectedId(null);

    setComment("");

    setAnnotationTitle("");

    setAnnotationStatus("Open");

    setEditingAnnotationId(null);

    setShowCommentBox(false);
  }

  function toggleVisibility(objectId) {
    updateScene((current) => {
      if (objectId === "uploaded-model") {
        return {
          ...current,

          model: current.model
            ? { ...current.model, visible: current.model.visible === false }
            : null,
        };
      }

      return {
        ...current,

        primitives: current.primitives.map((object) =>
          object.id === objectId
            ? { ...object, visible: object.visible === false }
            : object,
        ),
      };
    });
  }

  function toggleLock(objectId) {
    updateScene((current) => {
      if (objectId === "uploaded-model") {
        return {
          ...current,

          model: current.model
            ? { ...current.model, locked: !current.model.locked }
            : null,
        };
      }

      return {
        ...current,

        primitives: current.primitives.map((object) =>
          object.id === objectId
            ? { ...object, locked: !object.locked }
            : object,
        ),
      };
    });
  }

  function deleteObject(objectId) {
    const name = getObjectName(objectId);

    if (!window.confirm(`Delete ${name} and its annotations?`)) return;

    updateScene((current) => ({
      model: objectId === "uploaded-model" ? null : current.model,

      primitives: current.primitives.filter((object) => object.id !== objectId),

      annotations: current.annotations.filter(
        (annotation) => annotation.objectId !== objectId,
      ),
    }));

    if (selectedObjectId === objectId) setSelectedObjectId(null);
  }

  function handleSaveProject() {
    const project = {
      app: "Collaborative 3D Annotation Layer",

      version: 1,

      savedAt: new Date().toISOString(),

      scene: sceneState,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "collaborative-3d-project.json";

    link.click();

    URL.revokeObjectURL(url);
  }

  function handleLoadProject(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);

        const loaded = parsed.scene || parsed;

        if (
          !loaded ||
          !Array.isArray(loaded.primitives) ||
          !Array.isArray(loaded.annotations)
        ) {
          throw new Error("Invalid project file");
        }

        applyScene(
          {
            model: loaded.model || null,

            primitives: loaded.primitives,

            annotations: loaded.annotations,
          },

          { history: true, broadcast: true },
        );

        setSelectedObjectId(null);

        closeCommentBox();
      } catch {
        alert("This is not a valid Collaborative 3D project file.");
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  function objectRows() {
    const rows = [];

    if (sceneState.model) rows.push(sceneState.model);

    return [...rows, ...primitiveObjects];
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#02081a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <input
        ref={uploadInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.fbx,.stl,.ply"
        onChange={handleModelUpload}
        style={{ display: "none" }}
      />

      {showPrimitiveMenu && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 277,
            zIndex: 100,
            width: 150,
            padding: 8,
            background: "#1f2937",
            border: "1px solid #475569",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          }}
        >
          {Object.keys(primitiveNames).map((type) => (
            <button
              key={type}
              onClick={() => handlePrimitiveSelect(type)}
              style={{
                width: "100%",
                padding: "9px 10px",
                marginBottom: 5,
                background: "#374151",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
              }}
            >
              {primitiveNames[type]}
            </button>
          ))}
        </div>
      )}

      {modelName && (
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            zIndex: 15,
            padding: "6px 10px",
            background: "rgba(15,23,42,0.85)",
            color: "#cbd5e1",
            border: "1px solid #334155",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {modelName}
        </div>
      )}

      <Canvas
        camera={{ position: [4, 4, 4], fov: 50 }}
        style={{ background: "#111111" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        <Grid
          position={[0, 0, 0]}
          infiniteGrid
          side={DoubleSide}
          fadeDistance={100}
          fadeStrength={1}
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#6b7280"
          cellSize={1}
          cellThickness={0.5}
          cellColor="#374151"
        />
        <axesHelper args={[10]} />

        {sceneState.model && sceneState.model.visible !== false && (
          <group
            ref={modelGroupRef}
            position={sceneState.model.position}
            rotation={sceneState.model.rotation}
            scale={sceneState.model.scale}
          >
            <UploadedModel
              url={sceneState.model.url}
              fileType={sceneState.model.fileType}
              onClick={handleModelClick}
            />
            {annotations
              .filter((annotation) => annotation.objectId === "uploaded-model")
              .map((annotation) => (
                <AnnotationPin
                  key={annotation.id}
                  position={annotation.position}
                  text={annotation.comment || annotation.title}
                  onRemove={() => removeAnnotation(annotation.id)}
                />
              ))}
          </group>
        )}

        {primitiveObjects.map((object) => (
          <SelectablePrimitive
            key={object.id}
            object={object}
            selectedObjectId={selectedObjectId}
            setSelectedObjectId={setSelectedObjectId}
            primitiveGroupRefs={primitiveGroupRefs}
            handlePrimitiveClick={handlePrimitiveClick}
            annotations={annotations}
            removeAnnotation={removeAnnotation}
          />
        ))}

        {transformTarget && (
          <TransformControls
            object={transformTarget}
            mode={transformMode}
            enabled={
              Boolean(selectedObjectId) &&
              (selectedObjectId === "uploaded-model"
                ? !sceneState.model?.locked
                : !sceneState.primitives.find(
                    (object) => String(object.id) === String(selectedObjectId),
                  )?.locked)
            }
            onDraggingChanged={(event) => {
              setIsTransforming(event.value);
              activeTransformObjectRef.current = event.value
                ? selectedObjectId
                : null;

              if (!event.value && selectedObjectId) {
                if (selectedObjectId === "uploaded-model") {
                  updateModelTransform();
                } else {
                  updateObjectTransform(selectedObjectId);
                }
              }
            }}
            onChange={() => {
              if (!transformTarget || !selectedObjectId) return;

              const selectedObject =
                selectedObjectId === "uploaded-model"
                  ? sceneState.model
                  : sceneState.primitives.find(
                      (object) =>
                        String(object.id) === String(selectedObjectId),
                    );

              if (!selectedObject || selectedObject.locked) return;
              broadcastTransform(selectedObjectId, transformTarget);
            }}
          />
        )}

        <CollaborativeCamera
          followUserId={followUserId}
          remoteCamerasRef={remoteCamerasRef}
          broadcastMessage={broadcastMessage}
          isTransforming={isTransforming}
        />

        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport
            axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
            labelColor="white"
            hideNegativeAxes={false}
          />
        </GizmoHelper>
      </Canvas>

      {showCommentBox && (
        <aside
          style={{
            position: "absolute",
            top: "75px",
            right: "20px",
            zIndex: 50,
            width: "330px",
            padding: "18px",
            color: "#e5e7eb",
            background: "#28292c",
            border: "1px solid #2a3647",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              color: "#f8fafc",
              fontSize: "19px",
              fontWeight: 600,
            }}
          >
            {editingAnnotationId ? "Edit Annotation" : "Add Annotation"}
          </h2>

          {/* Select annotation */}
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              color: "#cbd5e1",
              fontSize: "13px",
            }}
          >
            Annotation
          </label>

          <select
            value={selectedId ?? ""}
            onChange={(event) => handleSelectAnnotation(event.target.value)}
            style={{
              width: "100%",
              height: "38px",
              padding: "0 10px",
              marginBottom: "13px",
              background: "#5a5b5d",
              color: "#f8fafc",
              border: "1px solid #0f1114",
              borderRadius: "6px",
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          >
            <option value="">Select a pin</option>

            {annotations.map((annotation, index) => (
              <option key={annotation.id} value={annotation.id}>
                Pin {index + 1} — {annotation.title || "Untitled"}
              </option>
            ))}
          </select>

          {/* Title */}
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              color: "#cbd5e1",
              fontSize: "13px",
            }}
          >
            Title
          </label>

          <input
            value={annotationTitle}
            onChange={(event) => setAnnotationTitle(event.target.value)}
            placeholder="Enter annotation title"
            style={{
              width: "100%",
              height: "38px",
              padding: "0 10px",
              marginBottom: "13px",
              background: "#5a5b5d",
              color: "#f8fafc",
              border: "1px solid #0f1114",
              borderRadius: "6px",
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          />

          {/* Description */}
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              color: "#cbd5e1",
              fontSize: "13px",
            }}
          >
            Description
          </label>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Describe the issue..."
            rows={3}
            style={{
              width: "100%",
              height: "72px",
              padding: "9px 10px",
              marginBottom: "15px",
              background: "#5a5b5d",
              color: "#f8fafc",
              border: "1px solid #0f1114",
              borderRadius: "6px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              fontSize: "13px",
              lineHeight: 1.4,
              boxSizing: "border-box",
            }}
          />

          {/* Annotation information */}
          {selectedId !== null &&
            (() => {
              const currentAnnotation = annotations.find(
                (annotation) => annotation.id === selectedId,
              );

              return currentAnnotation ? (
                <div
                  style={{
                    background: "#414243",
                    border: "1px solid #334155",
                    padding: "9px 10px",
                    borderRadius: "6px",
                    marginBottom: "14px",
                    color: "#94a3b8",
                    fontSize: "11px",
                    lineHeight: 1.5,
                  }}
                >
                  <div>
                    <strong style={{ color: "#e2e8f0" }}>Object:</strong>{" "}
                    {getObjectName(currentAnnotation.objectId)}
                  </div>

                  <div>
                    <strong style={{ color: "#e2e8f0" }}>Position:</strong> X{" "}
                    {currentAnnotation.position[0].toFixed(2)} · Y{" "}
                    {currentAnnotation.position[1].toFixed(2)} · Z{" "}
                    {currentAnnotation.position[2].toFixed(2)}
                  </div>
                </div>
              ) : null;
            })()}

          {/* Save */}
          <button
            onClick={handleSaveComment}
            style={{
              width: "100%",
              height: "40px",
              padding: "0 12px",
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            Save Annotation
          </button>

          {/* Cancel */}
          <button
            onClick={closeCommentBox}
            style={{
              width: "100%",
              height: "38px",
              padding: "0 12px",
              background: "#374151",
              color: "#e5e7eb",
              border: "1px solid #4b5563",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </aside>
      )}
    </div>
  );
}

export default ThreeDViewer;
