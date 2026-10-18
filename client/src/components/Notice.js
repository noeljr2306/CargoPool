export default function Notice({ type = "error", children }) {
  if (!children) return null;
  const style =
    type === "success"
      ? "border-sea/30 bg-sea/10 text-sea"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${style}`}>
      {children}
    </p>
  );
}
