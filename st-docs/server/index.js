import express from "express";
import cors from "cors";
import { getDb, initSchema, runInTransaction } from "./db.js";
import { seedIfEmpty } from "./seed.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const db = getDb();

const allowedStatus = new Set(["required", "optional"]);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function mapContentTypeRow(row) {
  return {
    id: row.id,
    name: row.name,
    machine: row.machine,
    group: row.group_name,
    icon: row.icon,
    color: row.color,
    description: row.description,
    taxonomyNote: row.taxonomy_note,
    note: row.note_kind && row.note_text ? { kind: row.note_kind, text: row.note_text } : undefined,
  };
}

function getFields(contentTypeId) {
  return db
    .prepare(
      `SELECT id, label, machine, hint, status, type, multiple
       FROM fields
       WHERE content_type_id = ?
       ORDER BY sort_order ASC, id ASC`,
    )
    .all(contentTypeId)
    .map((field) => ({
      id: field.id,
      label: field.label,
      machine: field.machine,
      hint: field.hint,
      status: field.status,
      type: field.type,
      multiple: Boolean(field.multiple),
    }));
}

function validateContentType(payload, { partial = false } = {}) {
  const required = ["id", "name", "machine", "group"];
  if (!partial) {
    for (const key of required) {
      if (!payload[key] || typeof payload[key] !== "string") {
        return `${key} is required`;
      }
    }
  }
  if (payload.fields && !Array.isArray(payload.fields)) {
    return "fields must be an array";
  }
  return null;
}

function validateField(field) {
  if (!field || typeof field !== "object") return "field payload is required";
  if (!field.label || !field.machine || !field.status || !field.type) return "field requires label, machine, status, and type";
  if (!allowedStatus.has(field.status)) return "field status must be required or optional";
  return null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/content-types", (_req, res) => {
  const contentTypes = db
    .prepare("SELECT * FROM content_types ORDER BY group_name ASC, name ASC")
    .all()
    .map((row) => {
      const mapped = mapContentTypeRow(row);
      mapped.fields = getFields(row.id);
      return mapped;
    });
  res.json(contentTypes);
});

app.get("/api/content-types/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM content_types WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Content type not found" });
  const data = mapContentTypeRow(row);
  data.fields = getFields(row.id);
  return res.json(data);
});

app.post("/api/content-types", (req, res) => {
  const validationError = validateContentType(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const fields = req.body.fields ?? [];
  for (const field of fields) {
    const fieldErr = validateField(field);
    if (fieldErr) return res.status(400).json({ error: fieldErr });
  }

  const tx = (payload) => runInTransaction(() => {
    db.prepare(
      `INSERT INTO content_types (
        id, name, machine, group_name, icon, color, description, taxonomy_note, note_kind, note_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      payload.id,
      payload.name,
      payload.machine,
      payload.group,
      payload.icon ?? null,
      payload.color ?? null,
      payload.description ?? null,
      payload.taxonomyNote ?? null,
      payload.note?.kind ?? null,
      payload.note?.text ?? null,
    );

    const insertField = db.prepare(
      `INSERT INTO fields (content_type_id, label, machine, hint, status, type, multiple, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    fields.forEach((field, index) => {
      insertField.run(
        payload.id,
        field.label,
        field.machine,
        field.hint ?? null,
        field.status,
        field.type,
        field.multiple ? 1 : 0,
        index,
      );
    });
  });

  try {
    tx(req.body);
    return res.status(201).json({ ok: true, id: req.body.id });
  } catch (error) {
    return res.status(409).json({ error: error.message });
  }
});

app.put("/api/content-types/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM content_types WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Content type not found" });

  const validationError = validateContentType(req.body, { partial: true });
  if (validationError) return res.status(400).json({ error: validationError });

  const fields = Array.isArray(req.body.fields) ? req.body.fields : null;
  if (fields) {
    for (const field of fields) {
      const fieldErr = validateField(field);
      if (fieldErr) return res.status(400).json({ error: fieldErr });
    }
  }

  const tx = () => runInTransaction(() => {
    db.prepare(
      `UPDATE content_types SET
        name = COALESCE(?, name),
        machine = COALESCE(?, machine),
        group_name = COALESCE(?, group_name),
        icon = ?,
        color = ?,
        description = ?,
        taxonomy_note = ?,
        note_kind = ?,
        note_text = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      req.body.name ?? null,
      req.body.machine ?? null,
      req.body.group ?? null,
      req.body.icon ?? null,
      req.body.color ?? null,
      req.body.description ?? null,
      req.body.taxonomyNote ?? null,
      req.body.note?.kind ?? null,
      req.body.note?.text ?? null,
      req.params.id,
    );

    if (fields) {
      db.prepare("DELETE FROM fields WHERE content_type_id = ?").run(req.params.id);
      const insertField = db.prepare(
        `INSERT INTO fields (content_type_id, label, machine, hint, status, type, multiple, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      fields.forEach((field, index) => {
        insertField.run(
          req.params.id,
          field.label,
          field.machine,
          field.hint ?? null,
          field.status,
          field.type,
          field.multiple ? 1 : 0,
          index,
        );
      });
    }
  });

  try {
    tx();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(409).json({ error: error.message });
  }
});

app.delete("/api/content-types/:id", (req, res) => {
  const result = db.prepare("DELETE FROM content_types WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Content type not found" });
  return res.json({ ok: true });
});

app.post("/api/content-types/:id/fields", (req, res) => {
  const existing = db.prepare("SELECT id FROM content_types WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Content type not found" });
  const fieldErr = validateField(req.body);
  if (fieldErr) return res.status(400).json({ error: fieldErr });

  const currentMax =
    db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM fields WHERE content_type_id = ?").get(req.params.id).max_sort ?? -1;
  const result = db
    .prepare(
      `INSERT INTO fields (content_type_id, label, machine, hint, status, type, multiple, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      req.params.id,
      req.body.label,
      req.body.machine,
      req.body.hint ?? null,
      req.body.status,
      req.body.type,
      req.body.multiple ? 1 : 0,
      currentMax + 1,
    );
  return res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

app.put("/api/content-types/:id/fields/:fieldId", (req, res) => {
  const fieldErr = validateField(req.body);
  if (fieldErr) return res.status(400).json({ error: fieldErr });

  const result = db
    .prepare(
      `UPDATE fields SET
        label = ?, machine = ?, hint = ?, status = ?, type = ?, multiple = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND content_type_id = ?`,
    )
    .run(
      req.body.label,
      req.body.machine,
      req.body.hint ?? null,
      req.body.status,
      req.body.type,
      req.body.multiple ? 1 : 0,
      Number(req.params.fieldId),
      req.params.id,
    );
  if (result.changes === 0) return res.status(404).json({ error: "Field not found" });
  return res.json({ ok: true });
});

app.delete("/api/content-types/:id/fields/:fieldId", (req, res) => {
  const result = db
    .prepare("DELETE FROM fields WHERE id = ? AND content_type_id = ?")
    .run(Number(req.params.fieldId), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Field not found" });
  return res.json({ ok: true });
});

initSchema();
seedIfEmpty();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
