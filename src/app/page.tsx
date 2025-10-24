"use client";
import { useState, useEffect, useCallback } from "react";
import { ITask } from "../../lib/models/Task"; // Import the canonical Task type

// Assuming you have a TaskCard component defined elsewhere
import TaskCard from "../../components/TaskCard";

// Helper type for the user object, assuming it comes from MongoDB/JWT
interface IUser {
  _id: string;
  email: string;
  username: string;
}

// Custom hook to handle alert messages gracefully
const useToast = () => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000); // Clear after 3 seconds
  };
  return { message, showToast };
};

export default function Home() {
  // --- State Declarations ---
  // Fix 1: Type the user state with the new IUser interface (or null)
  const [user, setUser] = useState<IUser | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});
  const [token, setToken] = useState<string | null>(null);
  
  const { message: toastMessage, showToast } = useToast();

  // --- Data Fetching (Read) ---
  const fetchTasks = useCallback(() => {
    if (!user || !token) return;
    fetch("/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      // Fix 2: Cast the incoming data to the ITask array type
      .then((data: ITask[]) => setTasks(data))
      .catch((error) => console.error("Failed to fetch tasks:", error));
  }, [user, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- Authentication Handlers ---
  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      // Fix 3: Ensure data.user matches IUser shape or is explicitly cast
      setUser(data.user as IUser); 
      setToken(data.token);
      showToast("Login successful!");
    } else {
      const data = await res.json();
      showToast(data.message || "Invalid email or password");
    }
  };

  const register = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
      }),
    });

    if (res.ok) {
      showToast("Registered successfully. You can now login.");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
    } else {
      const data = await res.json();
      showToast(data.message || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
    setToken(null);
    showToast("Logged out successfully.");
  };

  // --- CRUD Handlers ---

  // Add task (Create)
  const addTask = async () => {
    if (!title || !description) return showToast("Title and description required");
    if (!token) return showToast("Login required");

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      // Fix 4: Cast new task data to ITask
      const newTask = await res.json() as ITask; 
      setTasks([...tasks, newTask]);
      setTitle("");
      setDescription("");
      showToast("Task added!");
    } else {
      showToast("Failed to add task.");
    }
  };

  // Delete task (Delete)
  const deleteTask = async (id: string) => {
    if (!token) return showToast("Login required");
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(tasks.filter((task) => task._id !== id));
    showToast("Task deleted.");
  };

  // Start edit
  const startEdit = (task: ITask) => { // Fix 5: Use ITask here
    setEditingTaskId(task._id);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  };

  // Update task (Update)
  const updateTask = async () => {
    if (!editingTaskId) return;
    if (!editingTitle || !editingDescription) return showToast("Title and description required");
    if (!token) return showToast("Login required");

    const res = await fetch(`/api/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editingTitle, description: editingDescription }),
    });

    if (res.ok) {
      const updatedTask = await res.json() as ITask; // Fix 6: Cast updated task data
      setTasks(tasks.map((t) => (t._id === editingTaskId ? updatedTask : t)));
      setEditingTaskId(null);
      setEditingTitle("");
      setEditingDescription("");
      showToast("Task updated.");
    } else {
      showToast("Failed to update task");
    }
  };

  // Fetch AI suggestions (Add-on Feature)
  const fetchSuggestions = async (task: ITask) => { // Fix 7: Use ITask here
    if (!token) return showToast("Login required");
    setSuggestions((prev) => ({ ...prev, [task._id]: ["Loading..."] })); // Loading state

    const res = await fetch("/api/tasks/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: task.title, description: task.description }),
    });

    if (res.ok) {
      const data: { suggestions: string[] } = await res.json();
      setSuggestions((prev) => ({ ...prev, [task._id]: data.suggestions }));
    } else {
      showToast("Failed to fetch AI suggestions");
      setSuggestions((prev) => ({ ...prev, [task._id]: ["Failed to load suggestions."] }));
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">
          Collaborative Task Manager
        </h1>

        {/* Global Toast Message */}
        {toastMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl z-50">
            {toastMessage}
          </div>
        )}

        {/* Authentication Section */}
        {!user ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Login</h2>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button 
                  onClick={login} 
                  className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                >
                  Sign In
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Register</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                />
                <button 
                  onClick={register} 
                  className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition duration-150 shadow-md"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Application UI */
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md">
              <p className="text-lg font-medium text-gray-700">
                Welcome back, <span className="font-bold text-indigo-600">{user.username}</span>!
              </p>
              <button 
                onClick={logout} 
                className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition duration-150 shadow-sm"
              >
                Logout
              </button>
            </div>

            {/* Add Task (Create) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Add New Task</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Title (e.g., Implement Auth flow)"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description..."
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-2/3 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button 
                  onClick={addTask} 
                  className="shrink-0 bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-150 shadow-md"
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* Task List (Read, Update, Delete) */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Your Tasks ({tasks.length})</h2>
              {tasks.length === 0 ? (
                <p className="text-gray-500 italic">No tasks yet. Add one above!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => (
                    <div key={task._id} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                      {editingTaskId === task._id ? (
                        /* Edit Form */
                        <div className="flex flex-col gap-2">
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="border px-3 py-1 rounded w-full font-bold"
                          />
                          <textarea
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="border px-3 py-1 rounded w-full h-20 resize-none"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={updateTask}
                              className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Task Display with Actions */
                        <>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <strong className="text-lg font-bold text-gray-800">{task.title}</strong>
                              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => startEdit(task)}
                                className="text-indigo-600 hover:text-indigo-800 transition text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTask(task._id)}
                                className="text-red-600 hover:text-red-800 transition text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          {/* AI Suggestions Feature */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => fetchSuggestions(task)}
                              className="w-full bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-150 shadow-md"
                            >
                              Get AI Suggestions
                            </button>
                            {suggestions[task._id] && (
                              <ul className="mt-2 list-disc list-inside text-sm text-purple-800 bg-purple-50 p-3 rounded-lg">
                                {suggestions[task._id].map((s, idx) => (
                                  <li key={idx} className="mb-1">{s}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer with Submission Guidelines Info */}
            <footer className="mt-10 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
                <p>Full-Stack Assignment Project</p>
                <p>Developer: [Your Name Here]</p>
                <p>GitHub Profile: <a href="https://github.com/Vinay-Singal/Collab-Task/" target="_blank" className="text-indigo-500 hover:underline">[Your GitHub Profile]</a></p>
                <p>LinkedIn Profile: <a href="https://www.linkedin.com/in/singalvinay/" target="_blank" className="text-indigo-500 hover:underline">[Your LinkedIn Profile]</a></p>
            </footer>
          </div>
        )}
      </div>
    </main>
  );
}
