
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DB_NAME = "FileVaultReactDB";
const STORE = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFile(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(file);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly")
      .objectStore(STORE).getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteStoredFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getIcon(type = "") {
  if (type.includes("image")) return "🖼️";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word")) return "📘";
  if (type.includes("spreadsheet") || type.includes("excel")) return "📗";
  if (type.includes("text")) return "📄";
  return "📁";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [user, setUser] = useState({});
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [dark, setDark] = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [preview, setPreview] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!current) {
      navigate("/login");
      return;
    }

    setUser(current);

    async function load() {
      try {
        const stored = await getFiles();
        setFiles(stored.filter(f => f.owner === current.email));
      } catch {
        setMessage("Unable to load saved files.");
      }
    }

    load();

    const savedFolders = JSON.parse(
      localStorage.getItem("fvReactFolders_" + current.email) || "[]"
    );
    setFolders(savedFolders);

    setDark(localStorage.getItem("fvReactDark_" + current.email) === "true");
  }, [navigate]);

  useEffect(() => {
    document.body.classList.toggle("fv-dark", dark);
    if (user.email) {
      localStorage.setItem("fvReactDark_" + user.email, String(dark));
    }
    return () => document.body.classList.remove("fv-dark");
  }, [dark, user.email]);

  function notify(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  async function uploadFiles(selected) {
    const chosen = Array.from(selected || []);
    if (!chosen.length) return;

    try {
      const additions = [];

      for (const file of chosen) {
        const record = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          date: new Date().toISOString(),
          owner: user.email,
          blob: file,
          starred: false,
          deleted: false,
          folder: ""
        };

        await saveFile(record);
        additions.push(record);
      }

      setFiles(old => [...additions, ...old]);
      notify(`${chosen.length} file(s) uploaded successfully!`);
    } catch {
      notify("File upload failed. Please try again.");
    }
  }

  function handleUpload(e) {
    uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  function createFolder(e) {
    e.preventDefault();

    if (!folderName.trim()) return;

    const updated = [
      ...folders,
      {
        id: Date.now(),
        name: folderName.trim()
      }
    ];

    setFolders(updated);
    localStorage.setItem(
      "fvReactFolders_" + user.email,
      JSON.stringify(updated)
    );

    setFolderName("");
    setShowFolder(false);
    notify("Folder created successfully!");
  }

  function updateFile(id, changes) {
    const updated = files.map(file =>
      file.id === id ? { ...file, ...changes } : file
    );

    setFiles(updated);

    const target = updated.find(file => file.id === id);
    if (target) saveFile(target);
  }

  function moveToTrash(id) {
    updateFile(id, { deleted: true });
    notify("File moved to trash.");
  }

  function restoreFile(id) {
    updateFile(id, { deleted: false });
    notify("File restored.");
  }

  async function permanentlyDelete(id) {
    await deleteStoredFile(id);
    setFiles(old => old.filter(file => file.id !== id));
    notify("File permanently deleted.");
  }

  function downloadFile(file) {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function previewFile(file) {
    if (!file.type.startsWith("image/") &&
        file.type !== "application/pdf" &&
        !file.type.startsWith("text/")) {
      notify("Preview is available for images, PDFs and text files.");
      return;
    }

    setPreview(file);
  }

  async function shareFile(file) {
    const url = URL.createObjectURL(file.blob);

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/#file-${file.id}`
      );
      notify("Demo sharing link copied. Real sharing needs a server.");
    } catch {
      notify("Sharing is a demonstration in this frontend version.");
    }

    URL.revokeObjectURL(url);
  }

  function logout() {
    localStorage.removeItem("currentUser");
    navigate("/login");
  }

  const activeFiles = files.filter(file => !file.deleted);
  const trashedFiles = files.filter(file => file.deleted);

  const filteredFiles = useMemo(() => {
    let result = active === "Trash" ? trashedFiles : activeFiles;

    if (active === "Starred") {
      result = result.filter(file => file.starred);
    }

    if (active === "Recent Files") {
      result = [...result].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ).slice(0, 8);
    }

    if (active === "Shared Files") {
      result = [];
    }

    if (active.startsWith("Folder:")) {
      const name = active.replace("Folder:", "");
      result = result.filter(file => file.folder === name);
    }

    if (search.trim()) {
      result = result.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filter !== "All") {
      result = result.filter(file =>
        file.type.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (sort === "newest") {
      result = [...result].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    } else if (sort === "oldest") {
      result = [...result].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    } else if (sort === "name") {
      result = [...result].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else if (sort === "size") {
      result = [...result].sort((a, b) => b.size - a.size);
    }

    return result;
  }, [files, active, search, filter, sort]);

  const totalStorage = activeFiles.reduce((sum, file) => sum + file.size, 0);
  const imageCount = activeFiles.filter(f => f.type.startsWith("image/")).length;
  const pdfCount = activeFiles.filter(f => f.type.includes("pdf")).length;

  const menu = [
    { name: "Dashboard", icon: "▦" },
    { name: "My Files", icon: "▤" },
    { name: "Shared Files", icon: "↗" },
    { name: "Recent Files", icon: "◷" },
    { name: "Starred", icon: "☆" },
    { name: "Trash", icon: "▱" },
    { name: "Settings", icon: "⚙" }
  ];

  return (
    <div className="fv-app">

      <aside className="fv-sidebar">
        <div className="fv-brand">
          <span className="fv-logo">F</span>
          <span>FileVault <b>Pro</b></span>
        </div>

        <p className="fv-side-label">PERSONAL WORKSPACE</p>

        <nav className="fv-menu">
          {menu.map(item => (
            <button
              key={item.name}
              className={active === item.name ? "selected" : ""}
              onClick={() => setActive(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
              {item.name === "Trash" && trashedFiles.length > 0 &&
                <small>{trashedFiles.length}</small>}
            </button>
          ))}
        </nav>

        <div className="fv-side-folders">
          <div className="fv-folder-heading">
            <span>MY FOLDERS</span>
            <button onClick={() => setShowFolder(true)}>＋</button>
          </div>

          {folders.map(folder => (
            <button
              key={folder.id}
              className={active === "Folder:" + folder.name ? "selected" : ""}
              onClick={() => setActive("Folder:" + folder.name)}
            >
              📁 {folder.name}
            </button>
          ))}

          {folders.length === 0 &&
            <p className="fv-no-folder">No folders yet</p>}
        </div>

        <div className="fv-storage">
          <div className="fv-storage-title">
            <span>Storage Used</span>
            <b>{formatSize(totalStorage)}</b>
          </div>
          <div className="fv-storage-bar">
            <span style={{ width: `${Math.min(totalStorage / (100 * 1024 * 1024) * 100, 100)}%` }} />
          </div>
          <small>Local browser storage · Demo</small>
        </div>

        <div className="fv-profile">
          <div className="fv-avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="fv-profile-info">
            <b>{user.name || "User"}</b>
            <small>{user.email}</small>
          </div>
          <button onClick={logout} title="Logout">↪</button>
        </div>
      </aside>

      <main className="fv-main">

        <header className="fv-topbar">
          <div className="fv-breadcrumb">
            <span>Workspace</span> / <b>{active}</b>
          </div>

          <div className="fv-top-actions">
            <div className="fv-search">
              <span>⌕</span>
              <input
                placeholder="Search your files..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              className="fv-icon-button"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              ♧
              <i />
            </button>

            <button
              className="fv-icon-button"
              title="Toggle dark mode"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>

          {showNotifications && (
            <div className="fv-notification">
              <b>Notifications</b>
              <p>Welcome to FileVault Pro!</p>
              <p>Your files are stored in this browser.</p>
              <button onClick={() => setShowNotifications(false)}>Close</button>
            </div>
          )}
        </header>

        {active === "Dashboard" ? (
          <>
            <section className="fv-hero">
              <div>
                <span className="fv-hero-tag">YOUR DIGITAL WORKSPACE</span>
                <h1>Manage your files<br />with confidence.</h1>
                <p>Upload, organize and access all your important files in one place.</p>
                <button onClick={() => fileInput.current?.click()}>
                  ＋ Upload Files
                </button>
              </div>
              <div className="fv-hero-art">☁️</div>
            </section>

            <section className="fv-stats">
              <div className="fv-stat-card">
                <div className="fv-stat-icon purple">▤</div>
                <div><small>Total Files</small><h2>{activeFiles.length}</h2><span>Files in workspace</span></div>
              </div>

              <div className="fv-stat-card">
                <div className="fv-stat-icon blue">📁</div>
                <div><small>Total Folders</small><h2>{folders.length}</h2><span>Organized folders</span></div>
              </div>

              <div className="fv-stat-card">
                <div className="fv-stat-icon green">↗</div>
                <div><small>Shared Files</small><h2>0</h2><span>Demo sharing</span></div>
              </div>

              <div className="fv-stat-card">
                <div className="fv-stat-icon orange">▥</div>
                <div><small>Storage Used</small><h2>{formatSize(totalStorage)}</h2><span>In this browser</span></div>
              </div>
            </section>
          </>
        ) : (
          <section className="fv-page-heading">
            <span>FILE MANAGEMENT</span>
            <h1>{active}</h1>
            <p>Manage and organize your digital workspace.</p>
          </section>
        )}

        {active === "Dashboard" && (
          <section className="fv-upload-panel">
            <div className="fv-section-title">
              <div><h2>Upload Files</h2><p>Drag and drop files or browse your device</p></div>
              <button onClick={() => fileInput.current?.click()}>Browse Files</button>
            </div>

            <div
              className={`fv-dropzone ${dragging ? "drag-active" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInput.current?.click()}
            >
              <div className="fv-upload-icon">☁</div>
              <h3>Drop your files here</h3>
              <p>or <b>browse files</b> from your computer</p>
              <small>PDF, images, documents and other file types</small>
            </div>

            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={handleUpload}
            />
          </section>
        )}

        {active === "Dashboard" && (
          <section className="fv-folder-section">
            <div className="fv-section-title">
              <div><h2>Folders</h2><p>Keep your files organized</p></div>
              <button onClick={() => setShowFolder(true)}>＋ New Folder</button>
            </div>

            <div className="fv-folder-grid">
              {folders.map(folder => (
                <button
                  className="fv-folder-card"
                  key={folder.id}
                  onClick={() => setActive("Folder:" + folder.name)}
                >
                  <span>📁</span>
                  <b>{folder.name}</b>
                  <small>{activeFiles.filter(f => f.folder === folder.name).length} files</small>
                </button>
              ))}

              <button className="fv-folder-card add-folder" onClick={() => setShowFolder(true)}>
                <span>＋</span><b>Create Folder</b><small>Organize your files</small>
              </button>
            </div>
          </section>
        )}

        <section className="fv-files-section">
          <div className="fv-section-title">
            <div>
              <h2>{active === "Dashboard" ? "Recent Files" : active}</h2>
              <p>{filteredFiles.length} file(s) found</p>
            </div>
          </div>

          <div className="fv-file-controls">
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All file types</option>
              <option value="image">Images</option>
              <option value="pdf">PDF files</option>
              <option value="text">Text files</option>
            </select>

            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="size">Largest first</option>
            </select>
          </div>

          {filteredFiles.length > 0 ? (
            <div className="fv-file-grid">
              {filteredFiles.map(file => (
                <article className="fv-file-card" key={file.id}>
                  <div className="fv-file-card-top">
                    <span className="fv-file-type">{getIcon(file.type)}</span>
                    <button
                      className={file.starred ? "star active-star" : "star"}
                      onClick={() => updateFile(file.id, { starred: !file.starred })}
                    >{file.starred ? "★" : "☆"}</button>
                  </div>

                  <h3 title={file.name}>{file.name}</h3>
                  <p>{formatSize(file.size)} · {new Date(file.date).toLocaleDateString()}</p>

                  <div className="fv-file-actions">
                    {active === "Trash" ? (
                      <>
                        <button onClick={() => restoreFile(file.id)}>Restore</button>
                        <button onClick={() => permanentlyDelete(file.id)}>Delete forever</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => previewFile(file)}>Preview</button>
                        <button onClick={() => downloadFile(file)}>Download</button>
                        <button onClick={() => shareFile(file)}>Share</button>
                        <button onClick={() => moveToTrash(file.id)}>Trash</button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fv-empty">
              <div>📂</div>
              <h3>No files found</h3>
              <p>Upload files or change your search and filters.</p>
              <button onClick={() => fileInput.current?.click()}>＋ Upload Files</button>
            </div>
          )}
        </section>

        {active === "Settings" && (
          <section className="fv-settings">
            <h2>Settings</h2>
            <p>Customize your FileVault Pro workspace.</p>
            <div className="fv-setting-row">
              <div><b>Dark Mode</b><small>Change the dashboard appearance</small></div>
              <button onClick={() => setDark(!dark)}>{dark ? "Turn off" : "Turn on"}</button>
            </div>
            <div className="fv-setting-row">
              <div><b>Account</b><small>{user.email}</small></div>
              <button onClick={logout}>Logout</button>
            </div>
          </section>
        )}

        <footer className="fv-footer">
          <span>© 2026 FileVault Pro</span>
          <span>Organize · Manage · Access</span>
        </footer>
      </main>

      {message && <div className="fv-toast">{message}</div>}

      {showFolder && (
        <div className="fv-modal-backdrop">
          <form className="fv-modal" onSubmit={createFolder}>
            <h2>Create New Folder</h2>
            <p>Enter a name for your folder.</p>
            <input
              autoFocus
              placeholder="Folder name"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
            />
            <div className="fv-modal-actions">
              <button type="button" onClick={() => setShowFolder(false)}>Cancel</button>
              <button type="submit">Create Folder</button>
            </div>
          </form>
        </div>
      )}

      {preview && (
        <div className="fv-modal-backdrop">
          <div className="fv-preview-modal">
            <div className="fv-preview-header">
              <b>{preview.name}</b>
              <button onClick={() => setPreview(null)}>✕</button>
            </div>

            {preview.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(preview.blob)} alt={preview.name} />
            ) : preview.type === "application/pdf" ? (
              <iframe title={preview.name} src={URL.createObjectURL(preview.blob)} />
            ) : (
              <pre>{URL.createObjectURL(preview.blob)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
