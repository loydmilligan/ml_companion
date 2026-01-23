/**
 * AdminSelect Usage Examples
 *
 * This file demonstrates how to use the AdminSelect component.
 * NOT FOR PRODUCTION - for documentation/testing purposes only.
 */

import { useState } from "react";
import AdminSelect from "./AdminSelect";

export function AdminSelectExamples() {
  const [phase, setPhase] = useState("open");
  const [sortOrder, setSortOrder] = useState("desc");

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>AdminSelect Component Examples</h2>

      <h3>Basic Usage</h3>
      <AdminSelect
        label="Available during"
        value={phase}
        onChange={setPhase}
        options={[
          { value: "open", label: "Open phase only" },
          { value: "voting", label: "Voting phase only" },
          { value: "both", label: "Both open and voting" },
        ]}
      />

      <h3>With Icon</h3>
      <AdminSelect
        icon="📅"
        label="Available during"
        value={phase}
        onChange={setPhase}
        options={[
          { value: "open", label: "Open phase only" },
          { value: "voting", label: "Voting phase only" },
          { value: "both", label: "Both open and voting" },
        ]}
      />

      <h3>With Helper Text</h3>
      <AdminSelect
        icon="🔢"
        label="Sort order"
        helper="Choose how results should be ordered"
        value={sortOrder}
        onChange={setSortOrder}
        options={[
          { value: "asc", label: "Ascending" },
          { value: "desc", label: "Descending" },
        ]}
      />

      <h3>Disabled State</h3>
      <AdminSelect
        icon="🔒"
        label="Locked option"
        helper="This select is disabled"
        value="locked"
        onChange={() => {}}
        options={[
          { value: "locked", label: "Cannot change" },
          { value: "other", label: "Not available" },
        ]}
        disabled
      />
    </div>
  );
}
