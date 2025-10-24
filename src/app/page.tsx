"use client";
import { useState, useEffect } from "react";

interface Task {
  _id: string;
  title: string;
  description: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // AI suggestions
  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});

  // Auth token
  const [token, setToken] = useState<string | null>(null);

  // Fetch tasks
  useEffect(() => {
    if (!user || !token) return;
    fetch("/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTasks(data));
  }, [user, token]);

  // Login
  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
    } else {
      alert("Invalid email or password");
    }
  };

  // Register
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
      alert("Registered successfully. You can now login.");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
    } else {
      const data = await res.json();
      alert(data.message || "Registration failed");
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setTasks([]);
    setToken(null);
  };

  // Add task
  const addTask = async () => {
    if (!title || !description) return alert("Title and description required");
    if (!token) return alert("Login required");

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setTitle("");
      setDescription("");
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    if (!token) return alert("Login required");
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(tasks.filter((task) => task._id !== id));
  };

  // Start edit
  const startEdit = (task: Task) => {
    setEditingTaskId(task._id);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  };

  // Update task
  const updateTask = async () => {
    if (!editingTaskId) return;
    if (!editingTitle || !editingDescription) return alert("Title and description required");
    if (!token) return alert("Login required");

    const res = await fetch(`/api/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editingTitle, description: editingDescription }),
    });

    if (res.ok) {
      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t._id === editingTaskId ? updatedTask : t)));
      setEditingTaskId(null);
      setEditingTitle("");
      setEditingDescription("");
    } else {
      alert("Failed to update task");
    }
  };

  // Fetch AI suggestions
  const fetchSuggestions = async (task: Task) => {
    if (!token) return alert("Login required");

    const res = await fetch("/api/tasks/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: task.title, description: task.description }),
    });

    if (res.ok) {
      const data = await res.json();
      setSuggestions((prev) => ({ ...prev, [task._id]: data.suggestions }));
    } else {
      alert("Failed to fetch AI suggestions");
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Task Manager</h1>

      {!user ? (
        <>
          {/* Login */}
          <div className="mb-4 p-4 border rounded">
            <h2 className="font-semibold mb-2">Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border px-2 py-1 rounded mb-2 w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border px-2 py-1 rounded mb-2 w-full"
            />
            <button onClick={login} className="bg-blue-500 text-white px-3 py-1 rounded">
              Login
            </button>
          </div>

          {/* Register */}
          <div className="mb-4 p-4 border rounded">
            <h2 className="font-semibold mb-2">Register</h2>
            <input
              type="text"
              placeholder="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              className="border px-2 py-1 rounded mb-2 w-full"
            />
            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="border px-2 py-1 rounded mb-2 w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              className="border px-2 py-1 rounded mb-2 w-full"
            />
            <button onClick={register} className="bg-green-500 text-white px-3 py-1 rounded">
              Register
            </button>
          </div>
        </>
      ) : (
        <>
          <button onClick={logout} className="bg-gray-600 text-white px-3 py-1 rounded mb-4">
            Logout
          </button>

          {/* Add task */}
          <div className="flex gap-2 mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="border px-2 py-1 rounded w-1/3"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="border px-2 py-1 rounded w-1/3"
            />
            <button onClick={addTask} className="bg-blue-500 text-white px-3 py-1 rounded">
              Add
            </button>
          </div>

          {/* Task list */}
          <ul>
            {tasks.map((task) => (
              <li key={task._id} className="border p-2 flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-center">
                  {editingTaskId === task._id ? (
                    <div className="flex flex-col gap-1 w-full">
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="border px-1 py-1 mb-1 w-full"
                      />
                      <input
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="border px-1 py-1 w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                  )}

                  <div className="flex gap-1">
                    {editingTaskId === task._id ? (
                      <button
                        onClick={updateTask}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(task)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => fetchSuggestions(task)}
                      className="bg-purple-500 text-white px-2 py-1 rounded"
                    >
                      Suggestions
                    </button>
                  </div>
                </div>

                {/* AI suggestions */}
                {suggestions[task._id] && (
                  <ul className="ml-2 mt-1 list-disc text-gray-700">
                    {suggestions[task._id].map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
