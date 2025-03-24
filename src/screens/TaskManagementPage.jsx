import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  BarChart2,
  CheckSquare,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';
import { 
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Map progress text to numerical values
const progressMap = {
  'Not Started': 0,
  'Just Beginning': 25,
  'In Progress': 50,
  'Almost Done': 75,
  'Complete': 100
};

// Map numerical values back to text
const getProgressText = (value) => {
  if (value === 0) return 'Not Started';
  if (value <= 25) return 'Just Beginning';
  if (value <= 50) return 'In Progress';
  if (value <= 75) return 'Almost Done';
  return 'Complete';
};

const TaskManagementPage = () => {
  const { currentUser, userProfile, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    dueDate: '', 
    progressStatus: 'Not Started', // Using text-based progress now
    description: '',
    priority: 'Medium',
    category: 'General',
    assignedTo: ''
  });

  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState({ 
    id: '', 
    title: '', 
    dueDate: '', 
    status: '', 
    progressStatus: 'Not Started', // Using text-based progress now
    description: '',
    priority: 'Medium',
    category: 'General',
    assignedTo: ''
  });

  const [taskFilter, setTaskFilter] = useState('All Tasks');
  const [sortOption, setSortOption] = useState('Sort by Due Date');

  // Fetch tasks from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksRef = collection(db, 'tasks');
        const q = query(
          tasksRef, 
          where('createdBy', '==', currentUser.uid),
          orderBy('dueDate', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const tasksList = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const dueDate = data.dueDate ? data.dueDate.toDate().toISOString().split('T')[0] : '';
          
          tasksList.push({
            id: doc.id,
            title: data.title,
            status: data.status,
            dueDate: dueDate,
            progress: data.progress || 0,
            progressStatus: getProgressText(data.progress || 0), // Convert number to text
            description: data.description || '',
            priority: data.priority || 'Medium',
            category: data.category || 'General',
            assignedTo: data.assignedTo || '',
            farmId: data.farmId || '',
            fieldId: data.fieldId || ''
          });
        });
        
        setTasks(tasksList);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

  // Add a new task to Firestore
  const handleAddTask = async () => {
    if (!currentUser) {
      setError("You must be logged in to add tasks");
      return;
    }
    
    if (newTask.title && newTask.dueDate) {
      try {
        // Convert text progress to numerical value for storage
        const progressValue = progressMap[newTask.progressStatus] || 0;
        
        const taskData = {
          title: newTask.title,
          status: 'Pending',
          dueDate: Timestamp.fromDate(new Date(newTask.dueDate)),
          progress: progressValue, // Store numerical value in Firebase
          description: newTask.description || '',
          priority: newTask.priority || 'Medium',
          category: newTask.category || 'General',
          assignedTo: newTask.assignedTo || '',
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        
        // Add the new task to the local state
        const newTaskWithId = {
          id: docRef.id,
          ...taskData,
          dueDate: newTask.dueDate, // Use the string format for the UI
          progressStatus: newTask.progressStatus // Keep the text version for the UI
        };
        
        setTasks([...tasks, newTaskWithId]);
        setNewTask({ 
          title: '', 
          dueDate: '', 
          progressStatus: 'Not Started',
          description: '',
          priority: 'Medium',
          category: 'General',
          assignedTo: ''
        });
        setNewTaskOpen(false);
      } catch (err) {
        console.error("Error adding task:", err);
        setError("Failed to add task");
      }
    }
  };

  // Update a task in Firestore
  const handleUpdateTask = async () => {
    if (!currentUser) {
      setError("You must be logged in to update tasks");
      return;
    }
    
    try {
      const taskRef = doc(db, 'tasks', editTaskData.id);
      
      // Convert text progress to numerical value for storage
      const progressValue = progressMap[editTaskData.progressStatus] || 0;
      
      const updateData = {
        title: editTaskData.title,
        status: editTaskData.status,
        dueDate: Timestamp.fromDate(new Date(editTaskData.dueDate)),
        progress: progressValue, // Store numerical value in Firebase
        description: editTaskData.description || '',
        priority: editTaskData.priority || 'Medium',
        category: editTaskData.category || 'General',
        assignedTo: editTaskData.assignedTo || '',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(taskRef, updateData);
      
      // Update the task in the local state
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === editTaskData.id ? {
          ...editTaskData,
          progress: progressValue, // Ensure we keep the numerical version too
          dueDate: editTaskData.dueDate // Ensure we preserve the string format for the UI
        } : t))
      );
      
      setEditTaskOpen(false);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
    }
  };

  // Delete a task from Firestore
  const handleDeleteTask = async (id) => {
    if (!currentUser) {
      setError("You must be logged in to delete tasks");
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'tasks', id));
      
      // Remove the task from the local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const calculateProgress = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'Completed').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  const progress = calculateProgress();

  const filterTasks = (list) => {
    switch (taskFilter) {
      case 'Pending Tasks':
        return list.filter((t) => t.status === 'Pending');
      case 'Completed Tasks':
        return list.filter((t) => t.status === 'Completed');
      default:
        return list;
    }
  };

  const sortTasks = (list) => {
    let sorted = [...list];
    switch (sortOption) {
      case 'Sort by Due Date':
        sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        break;
      case 'Sort by Status':
        const statusOrder = { Completed: 1, 'In Progress': 2, Pending: 3 };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      case 'Sort by Priority':
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        sorted.sort((a, b) => priorityOrder[a.priority || 'Medium'] - priorityOrder[b.priority || 'Medium']);
        break;
      default:
        break;
    }
    return sorted;
  };

  const displayedTasks = sortTasks(filterTasks(tasks));

  if (userLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading user data...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-6">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-6">Please sign in to access the task management system.</p>
        <button 
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <div className="p-6">
        <div
          className="text-white p-8 rounded-lg mb-10 bg-cover bg-center min-h-[300px] flex flex-col justify-center items-center text-center"
          style={{ backgroundImage: "url('/images/an-illustration-of-a-farmer-with-a-table_L4V3-UnkQGCJNaQ13n8RpQ_G0QbpQ9xSpGzAoaa-EHapw.png')" }}
        >
          <h2 className="text-3xl font-bold mb-4">Streamline Your Tasks</h2>
          <p className="mb-6 max-w-lg">
            Efficiently manage your farm tasks with innovative and intelligent task management
          </p>
          <button
            onClick={() => setNewTaskOpen(true)}
            className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
          >
            Create New Task
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
            <button 
              className="float-right" 
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-6">Task Progress</h3>
          <div className="bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">{progress}% of tasks completed</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-10">
          <h3 className="text-2xl font-bold mb-4">Task Management Dashboard</h3>

          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:bg-green-800 transition-all duration-200"
              onClick={() => setNewTaskOpen(true)}
            >
              <Plus size={18} /> Add New Task
            </button>

            <div className="flex gap-4">
              <select
                className="border rounded-md px-3 py-2 hover:border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
              >
                <option>All Tasks</option>
                <option>Pending Tasks</option>
                <option>Completed Tasks</option>
              </select>

              <select
                className="border rounded-md px-3 py-2 hover:border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option>Sort by Due Date</option>
                <option>Sort by Status</option>
                <option>Sort by Priority</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading tasks...</div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-10">
                  <p>No tasks found. Create your first task to get started!</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-4">Task</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Due Date</th>
                      <th className="text-left p-4">Priority</th>
                      <th className="text-left p-4">Progress</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTasks.map((task) => (
                      <tr key={task.id} className="border-t">
                        <td className="p-4">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-600">{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="p-4">{task.dueDate}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              task.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'Medium'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-green-600 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{task.progressStatus}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditTaskData({
                                  ...task,
                                  progressStatus: task.progressStatus, // Make sure to include the text version
                                  dueDate: task.dueDate // Ensure date format is correct
                                });
                                setEditTaskOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-1"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
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
        </div>

        {newTaskOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Task</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Task Title*</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1">Description</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2"
                    rows="3"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  ></textarea>
                </div>

                <div>
                  <label className="block mb-1">Due Date*</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Planting">Planting</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Progress</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={newTask.progressStatus}
                    onChange={(e) => setNewTask({ ...newTask, progressStatus: e.target.value })}
                  >
                    <option value="Not Started">Not Started (0%)</option>
                    <option value="Just Beginning">Just Beginning (25%)</option>
                    <option value="In Progress">In Progress (50%)</option>
                    <option value="Almost Done">Almost Done (75%)</option>
                    <option value="Complete">Complete (100%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  onClick={() => setNewTaskOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:bg-green-800 transition-all duration-200"
                  onClick={handleAddTask}
                  disabled={!newTask.title || !newTask.dueDate}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {editTaskOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Edit Task</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Task Title*</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.title}
                    onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1">Description</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2"
                    rows="3"
                    value={editTaskData.description || ''}
                    onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                  ></textarea>
                </div>

                <div>
                  <label className="block mb-1">Due Date*</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.dueDate}
                    onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.status}
                    onChange={(e) => setEditTaskData({ ...editTaskData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.priority || 'Medium'}
                    onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.category || 'General'}
                    onChange={(e) => setEditTaskData({ ...editTaskData, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Planting">Planting</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Progress</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editTaskData.progressStatus}
                    onChange={(e) => setEditTaskData({ ...editTaskData, progressStatus: e.target.value })}
                  >
                    <option value="Not Started">Not Started (0%)</option>
                    <option value="Just Beginning">Just Beginning (25%)</option>
                    <option value="In Progress">In Progress (50%)</option>
                    <option value="Almost Done">Almost Done (75%)</option>
                    <option value="Complete">Complete (100%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  onClick={() => setEditTaskOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:bg-green-800 transition-all duration-200"
                  onClick={handleUpdateTask}
                  disabled={!editTaskData.title || !editTaskData.dueDate}
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-6">Efficiently Manage Your Farm Tasks</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border p-4 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckSquare className="text-green-600" size={24} />
                </div>
              </div>
              <h4 className="font-bold mb-2">Creating Your First Task</h4>
              <p className="text-sm">
                Easily set up tasks by entering what needs to be done, when it's due, and who does it.
              </p>
            </div>

            <div className="border p-4 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
              <h4 className="font-bold mb-2">Assigning Tasks to Team Members</h4>
              <p className="text-sm">
                Delegate tasks to specific team members to enhance collaboration.
              </p>
            </div>

            <div className="border p-4 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <BarChart2 className="text-green-600" size={24} />
                </div>
              </div>
              <h4 className="font-bold mb-2">Tracking Task Progress</h4>
              <p className="text-sm">
                Monitor task completion with simple status options like "Not Started," "In Progress," and "Complete."
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TaskManagementPage;