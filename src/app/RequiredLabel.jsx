"use client";

export default function RequiredLabel({ children }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {children}
      <span style={{ color: "red" }}>*</span>
    </label>
  );
}