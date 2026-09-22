// src/components/table/StatusToggle.tsx
interface StatusToggleProps {
  active: boolean;
  onChange: () => void;
}

const StatusToggle = ({ active, onChange }: StatusToggleProps) => {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={active}
        onChange={onChange}
        className="peer sr-only"
      />
      <div
        className="relative h-4 w-8 rounded-full bg-gray-300 transition-colors 
        peer-checked:bg-green-500 peer-focus:ring-2 peer-focus:ring-green-300"
      >
        <div
          className="absolute left-[2px] top-[2px] h-3 w-3 rounded-full border border-gray-300 bg-white 
          transition-all peer-checked:translate-x-4"
        />
      </div>
    </label>
  );
};

export default StatusToggle;
