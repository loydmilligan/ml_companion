/**
 * AdminCard Usage Examples
 *
 * Demonstrates all variants of AdminCard component
 */

import AdminCard from "./AdminCard";

export function AdminCardExamples() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
      {/* Basic card with just children */}
      <AdminCard>
        <p>Basic card with just content and no header</p>
      </AdminCard>

      {/* Card with title and icon */}
      <AdminCard title="Settings" icon="⚙️">
        <p>Card with title and icon header</p>
      </AdminCard>

      {/* Blue card */}
      <AdminCard title="User Management" icon="👥" color="blue">
        <p>Blue left border for user-related settings</p>
      </AdminCard>

      {/* Green card */}
      <AdminCard title="Feature Flags" icon="🚩" color="green">
        <p>Green left border for enabled/success states</p>
      </AdminCard>

      {/* Purple card */}
      <AdminCard title="Advanced Options" icon="🔧" color="purple">
        <p>Purple left border for advanced features</p>
      </AdminCard>

      {/* Gray card */}
      <AdminCard title="System Info" icon="ℹ️" color="gray">
        <p>Gray left border for informational content</p>
      </AdminCard>

      {/* Card with custom className */}
      <AdminCard title="Custom Styled" icon="🎨" color="blue" className="my-custom-class">
        <p>Card with custom className applied</p>
      </AdminCard>

      {/* Card with only icon */}
      <AdminCard icon="📊">
        <p>Card with only icon in header</p>
      </AdminCard>

      {/* Card with only title */}
      <AdminCard title="Analytics">
        <p>Card with only title in header</p>
      </AdminCard>
    </div>
  );
}
