import { useSelector } from "react-redux";

const Loader = () => {
  const { globalLoading } = useSelector((state) => state.api);

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-dark/50">
      <div className="glass-effect rounded-lg p-6 flex flex-col items-center">
        <div className="animate-spin mb-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <p className="text-lightGray font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
