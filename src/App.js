    import React, { useState, useEffect } from 'react';

    // Base URL for your backend API.
    // IMPORTANT: This will be your LOCAL backend URL for development.
    // When deploying your frontend, you will change this to your LIVE backend URL.
    const BASE_URL = 'http://localhost:8080/registrations';

    // Main App Component
    const App = () => {
        const [currentPage, setCurrentPage] = useState('list'); // 'list', 'register', 'edit'
        const [vehicles, setVehicles] = useState([]);
        const [editingVehicle, setEditingVehicle] = useState(null);
        const [loading, setLoading] = useState(false);
        const [message, setMessage] = useState(''); // For success/error messages

        // --- API Interaction Functions ---

        // Fetches all vehicles from the backend
        const fetchVehicles = async () => {
            setLoading(true);
            setMessage('');
            try {
                const response = await fetch(BASE_URL); // GET http://localhost:8080/registrations
                if (!response.ok) {
                    // Attempt to read error message from backend if available
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                // Your backend returns { success: true, existingRegistrations: [...] }
                setVehicles(data.existingRegistrations || []);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                setMessage(`Error fetching vehicles: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Adds a new vehicle to the backend
        const addVehicle = async (vehicleData) => {
            setLoading(true);
            setMessage('');
            try {
                const response = await fetch(`${BASE_URL}/new`, { // POST http://localhost:8080/registrations/new
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(vehicleData),
                });

                const data = await response.json(); // Always parse JSON to get success/error messages

                if (!response.ok) {
                    // Backend sends error messages in 'error' field for 400/409 statuses
                    throw new Error(data.error || `Failed to add vehicle: ${response.status}`);
                }

                // Backend returns { success: "Registration Ok" }
                setMessage(data.success || 'Vehicle registered successfully!');
                fetchVehicles(); // Refresh the list
                setCurrentPage('list'); // Go back to list view
            } catch (error) {
                console.error('Error adding vehicle:', error);
                setMessage(`Error adding vehicle: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Updates an existing vehicle in the backend
        const updateVehicle = async (id, vehicleData) => {
            setLoading(true);
            setMessage('');
            try {
                const response = await fetch(`${BASE_URL}/update/${id}`, { // PUT http://localhost:8080/registrations/update/:id
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(vehicleData),
                });

                const data = await response.json(); // Always parse JSON

                if (!response.ok) {
                    // Backend sends error messages in 'error' field for 400/409 statuses
                    throw new Error(data.error || `Failed to update vehicle: ${response.status}`);
                }

                // Backend returns { success: "Update Successful", registration: updatedRegistration }
                setMessage(data.success || 'Vehicle updated successfully!');
                fetchVehicles(); // Refresh the list
                setCurrentPage('list'); // Go back to list view
                setEditingVehicle(null); // Clear editing state
            } catch (error) {
                console.error('Error updating vehicle:', error);
                setMessage(`Error updating vehicle: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Deletes a vehicle from the backend
        const deleteVehicle = async (id) => {
            setLoading(true);
            setMessage('');
            // Implement a simple confirmation dialog instead of alert()
            if (!window.confirm("Are you sure you want to delete this vehicle registration?")) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/delete/${id}`, { // DELETE http://localhost:8080/registrations/delete/:id
                    method: 'DELETE',
                });

                const data = await response.json(); // Always parse JSON

                if (!response.ok) {
                    // Backend sends error messages in 'error' field for 400/404 statuses
                    throw new Error(data.error || `Failed to delete vehicle: ${response.status}`);
                }

                // Backend returns { success: "Delete Successful", deletedRegistration: deletedRegistration }
                setMessage(data.success || 'Vehicle deleted successfully!');
                fetchVehicles(); // Refresh the list
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                setMessage(`Error deleting vehicle: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Fetch vehicles on component mount
        useEffect(() => {
            fetchVehicles();
        }, []);

        // --- Page Navigation and Rendering ---

        const navigateTo = (page, vehicle = null) => {
            setCurrentPage(page);
            setEditingVehicle(vehicle);
            setMessage(''); // Clear messages on navigation
        };

        const renderPage = () => {
            switch (currentPage) {
                case 'list':
                    return (
                        <VehicleList
                            vehicles={vehicles}
                            onEdit={(vehicle) => navigateTo('edit', vehicle)}
                            onDelete={deleteVehicle}
                            onRegisterNew={() => navigateTo('register')}
                            loading={loading}
                            message={message}
                        />
                    );
                case 'register':
                    return (
                        <VehicleForm
                            onSubmit={addVehicle}
                            onCancel={() => navigateTo('list')}
                            loading={loading}
                            message={message}
                        />
                    );
                case 'edit':
                    return (
                        <VehicleForm
                            vehicle={editingVehicle}
                            onSubmit={updateVehicle}
                            onCancel={() => navigateTo('list')}
                            loading={loading}
                            message={message}
                        />
                    );
                default:
                    return null;
            }
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 font-sans flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-200">
                    <h1 className="text-4xl font-extrabold text-center text-indigo-800 mb-8 tracking-tight">
                        Vehicle Registration System
                    </h1>
                    {renderPage()}
                </div>
            </div>
        );
    };

    // VehicleList Component
    const VehicleList = ({ vehicles, onEdit, onDelete, onRegisterNew, loading, message }) => {
        const [searchTerm, setSearchTerm] = useState('');

        // Filter vehicles based on search term
        const filteredVehicles = vehicles.filter(vehicle =>
            Object.values(vehicle).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        return (
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Registered Vehicles</h2>
                    <button
                        onClick={onRegisterNew}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold rounded-full shadow-lg hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Register New Vehicle
                    </button>
                </div>

                {/* Search Input */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                    />
                </div>

                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-indigo-600 text-lg font-medium">Loading vehicles...</p>
                    </div>
                )}
                {message && (
                    <div className={`p-4 rounded-lg text-center font-medium shadow-md ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                        {message}
                    </div>
                )}

                {filteredVehicles.length === 0 && !loading && !message ? (
                    <p className="text-center text-gray-600 text-lg py-8">No vehicles found matching your search criteria.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-xl border border-gray-200">
                        <table className="min-w-full bg-white">
                            <thead className="bg-indigo-50 border-b border-indigo-200">
                                <tr>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Owner ID</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">License Plate</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Manufacturer</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Model</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Manufactured Year</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Vehicle Type</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Color</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider">Owner</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider rounded-tr-xl">Registration Date</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider rounded-tr-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVehicles.map((vehicle) => ( // Use filteredVehicles here
                                    <tr key={vehicle._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.ownerId}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.plateNo}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.manufacturer}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.model}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.manufacturedYear}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.vehicle}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.color}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">{vehicle.owner}</td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base text-gray-900">
                                            {vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-3 px-6 whitespace-nowrap text-base">
                                            <button
                                                onClick={() => onEdit(vehicle)}
                                                className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium transition duration-150 ease-in-out transform hover:scale-110"
                                                title="Edit Vehicle"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(vehicle._id)}
                                                className="text-red-600 hover:text-red-800 font-medium transition duration-150 ease-in-out transform hover:scale-110"
                                                title="Delete Vehicle"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // VehicleForm Component (for Register and Edit)
    const VehicleForm = ({ vehicle, onSubmit, onCancel, loading, message }) => {
        const [formData, setFormData] = useState({
            ownerId: '',
            plateNo: '',
            vehicle: '',
            model: '',
            manufacturedYear: '',
            manufacturer: '',
            owner: '',
            color: '',
            registrationDate: '',
        });

        const isEditMode = !!vehicle;

        useEffect(() => {
            if (isEditMode && vehicle) {
                setFormData({
                    ownerId: vehicle.ownerId || '',
                    plateNo: vehicle.plateNo || '',
                    vehicle: vehicle.vehicle || '',
                    model: vehicle.model || '',
                    manufacturedYear: vehicle.manufacturedYear || '',
                    manufacturer: vehicle.manufacturer || '',
                    owner: vehicle.owner || '',
                    color: vehicle.color || '',
                    registrationDate: vehicle.registrationDate ? new Date(vehicle.registrationDate).toISOString().split('T')[0] : '',
                });
            } else {
                setFormData({
                    ownerId: '',
                    plateNo: '',
                    vehicle: '',
                    model: '',
                    manufacturedYear: '',
                    manufacturer: '',
                    owner: '',
                    color: '',
                    registrationDate: new Date().toISOString().split('T')[0],
                });
            }
        }, [vehicle, isEditMode]);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            const dataToSend = {
                ...formData,
                manufacturedYear: parseInt(formData.manufacturedYear, 10),
            };

            if (isEditMode) {
                onSubmit(vehicle._id, dataToSend);
            } else {
                onSubmit(dataToSend);
            }
        };

        return (
            <div className="space-y-8 p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
                    {isEditMode ? 'Edit Vehicle Registration' : 'Register New Vehicle'}
                </h2>

                {loading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-indigo-500 mx-auto mb-3"></div>
                        <p className="text-indigo-600 font-medium">Submitting data...</p>
                    </div>
                )}
                {message && (
                    <div className={`p-4 rounded-lg text-center font-medium shadow-md ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Owner ID */}
                    <div>
                        <label htmlFor="ownerId" className="block text-sm font-semibold text-gray-700 mb-1">
                            Owner ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="ownerId"
                            name="ownerId"
                            value={formData.ownerId}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., OID123"
                        />
                    </div>

                    {/* License Plate (plateNo) */}
                    <div>
                        <label htmlFor="plateNo" className="block text-sm font-semibold text-gray-700 mb-1">
                            License Plate (plateNo) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="plateNo"
                            name="plateNo"
                            value={formData.plateNo}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., ABC-1234"
                        />
                    </div>

                    {/* Manufacturer */}
                    <div>
                        <label htmlFor="manufacturer" className="block text-sm font-semibold text-gray-700 mb-1">
                            Manufacturer <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="manufacturer"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., Toyota"
                        />
                    </div>

                    {/* Model */}
                    <div>
                        <label htmlFor="model" className="block text-sm font-semibold text-gray-700 mb-1">
                            Model
                        </label>
                        <input
                            type="text"
                            id="model"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            // Removed 'required' attribute here
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., Camry"
                        />
                    </div>

                    {/* Manufactured Year */}
                    <div>
                        <label htmlFor="manufacturedYear" className="block text-sm font-semibold text-gray-700 mb-1">
                            Manufactured Year <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="manufacturedYear"
                            name="manufacturedYear"
                            value={formData.manufacturedYear}
                            onChange={handleChange}
                            required
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., 2023"
                        />
                    </div>

                    {/* Vehicle (as a string) */}
                    <div>
                        <label htmlFor="vehicle" className="block text-sm font-semibold text-gray-700 mb-1">
                            Vehicle Type / Description <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="vehicle"
                            name="vehicle"
                            value={formData.vehicle}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., Sedan, SUV, Truck"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-1">
                            Color
                        </label>
                        <input
                            type="text"
                            id="color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., Red, Blue, Black"
                        />
                    </div>

                    {/* Owner */}
                    <div>
                        <label htmlFor="owner" className="block text-sm font-semibold text-gray-700 mb-1">
                            Owner <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="owner"
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                            placeholder="e.g., John Doe"
                        />
                    </div>

                    {/* Registration Date */}
                    <div>
                        <label htmlFor="registrationDate" className="block text-sm font-semibold text-gray-700 mb-1">
                            Registration Date
                        </label>
                        <input
                            type="date"
                            id="registrationDate"
                            name="registrationDate"
                            value={formData.registrationDate}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-gray-800"
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="md:col-span-2 flex justify-end space-x-4 mt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-full shadow-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105"
                            disabled={loading}
                        >
                            {isEditMode ? 'Update Vehicle' : 'Register Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    export default App;
    