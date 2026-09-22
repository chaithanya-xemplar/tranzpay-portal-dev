import { useState } from "react";
import Button from "../../design-system/Button";
import Checkbox from "../../design-system/Checkbox";
import { MASTER_ROLES } from "../../constants/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: unknown) => void;
}

const roles = MASTER_ROLES;

const AddPermissionDialog = ({
  open,
  onClose,
  onSave,
}: Props) => {
  const [selectedRoles, setSelectedRoles] = useState<
    Record<number, boolean>
  >({});

  const [selectedEntity, setSelectedEntity] = useState("");

  if (!open) return null;

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [roleId]: checked,
    }));
  };

  const handleReset = () => {
    setSelectedEntity("");
    setSelectedRoles({});
  };

  const handleSave = () => {
    onSave({
      entityId: selectedEntity,
      roles: selectedRoles,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[550px] shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg text-dark-grey">
            Add New Permission
          </h2>

          <button onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">

          <label className="block text-sm text-medium-grey mb-2">
            Select Entity
          </label>

          <input
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            placeholder="Search entity..."
            className="w-full border border-divider rounded-lg h-10 px-3 mb-6"
          />

          <div className="grid grid-cols-3 gap-y-6">

            {roles.map((role) => (
              <div
                key={role.roleId}
                className="flex items-center gap-3"
              >
                <Checkbox
                  checked={selectedRoles[role.roleId] ?? false}
                  onChange={(val) =>
                    toggleRole(role.roleId, val)
                  }
                />

                <span className="text-medium-grey">
                  {role.roleName}
                </span>
              </div>
            ))}

          </div>

          <div className="flex gap-4 mt-8">

            <Button
              variant="primary"
              className="w-[120px]"
              onClick={handleSave}
            >
              Save
            </Button>

            <Button
              variant="outline"
              className="w-[120px]"
              onClick={handleReset}
            >
              Reset
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPermissionDialog;