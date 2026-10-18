const STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-sea/30 bg-sea/10 text-sea",
  info: "border-line bg-paper text-slate",
};

export default function Notice({ type = "error", children }) {
  if (!children) return null;

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${STYLES[type]}`}
    >
      {children}
    </p>
  );
}
