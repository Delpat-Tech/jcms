import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "../layout.tsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import FormField from "../../components/ui/FormField.jsx";
import { useToasts } from "../../components/util/Toasts.jsx";

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { addNotification } = useToasts() || { addNotification: () => {} };

  const token = localStorage.getItem("token");

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/superadmin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      addNotification('error', 'Error', 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, [token, addNotification]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRole 
        ? `http://localhost:5000/api/superadmin/roles/${editingRole._id}`
        : `http://localhost:5000/api/superadmin/roles`;
      
      const res = await fetch(url, {
        method: editingRole ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        addNotification('success', 'Success', editingRole ? 'Role updated' : 'Role created');
        fetchRoles();
        setShowModal(false);
        setFormData({ name: "", description: "" });
        setEditingRole(null);
      } else {
        addNotification('error', 'Error', data.message);
      }
    } catch (error) {
      addNotification('error', 'Error', 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    if (!role) {
      console.error('Role is undefined in handleEdit');
      return;
    }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setShowModal(true);
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/superadmin/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        addNotification('success', 'Success', 'Role deleted');
        fetchRoles();
      } else {
        addNotification('error', 'Error', data.message);
      }
    } catch (error) {
      addNotification('error', 'Error', 'Failed to delete role');
    }
  };

  const columns = [
    { key: "name", label: "Role" },
    { key: "description", label: "Description" },
    { key: "createdAt", label: "Created", render: (role: any) => new Date(role.createdAt).toLocaleDateString() }
  ] as any[];

  if (loading) return <SuperAdminLayout><div>Loading...</div></SuperAdminLayout>;

  return (
    <SuperAdminLayout title="Roles Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Roles Management</h1>
        </div>

        <Table data={roles} columns={columns} getRowKey={(role) => role._id} />

        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingRole(null);
            setFormData({ name: "", description: "" });
          }}
          title={editingRole ? "Edit Role" : "Add Role"}
          footer={null}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" htmlFor="name" error={null}>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Description" htmlFor="description" error={null}>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRole ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}

export default RolesPage;