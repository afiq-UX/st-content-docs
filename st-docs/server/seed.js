import fs from "fs";
import path from "path";
import vm from "vm";
import { dbPath, getDb, runInTransaction } from "./db.js";

function extractDataFromHtml() {
  const htmlPath = path.resolve(process.cwd(), "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const match = html.match(/var DATA = (\[[\s\S]*?\]);\s*\n/);

  if (!match) {
    throw new Error("Unable to find DATA array in index.html");
  }

  const script = `const DATA = ${match[1]}; DATA;`;
  return vm.runInNewContext(script);
}

function backupDatabase() {
  if (!fs.existsSync(dbPath)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${dbPath}.${stamp}.bak`;
  fs.copyFileSync(dbPath, backupPath);
}

export function seedIfEmpty() {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) AS count FROM content_types").get().count;
  if (total > 0) return false;

  const data = extractDataFromHtml();
  const insertContentType = db.prepare(`
    INSERT INTO content_types (
      id, name, machine, group_name, icon, color, description, taxonomy_note, note_kind, note_text
    ) VALUES (
      @id, @name, @machine, @group_name, @icon, @color, @description, @taxonomy_note, @note_kind, @note_text
    )
  `);

  const insertField = db.prepare(`
    INSERT INTO fields (
      content_type_id, label, machine, hint, status, type, multiple, sort_order
    ) VALUES (
      @content_type_id, @label, @machine, @hint, @status, @type, @multiple, @sort_order
    )
  `);

  const tx = () => runInTransaction(() => {
    data.forEach((item) => {
      insertContentType.run({
        id: item.id,
        name: item.name,
        machine: item.machine,
        group_name: item.group,
        icon: item.icon ?? null,
        color: item.color ?? null,
        description: item.description ?? null,
        taxonomy_note: item.taxonomyNote ?? null,
        note_kind: item.note?.kind ?? null,
        note_text: item.note?.text ?? null,
      });

      (item.fields ?? []).forEach((field, index) => {
        insertField.run({
          content_type_id: item.id,
          label: field.label,
          machine: field.machine,
          hint: field.hint ?? null,
          status: field.status,
          type: field.type,
          multiple: field.multiple ? 1 : 0,
          sort_order: index,
        });
      });
    });
  });

  backupDatabase();
  tx();
  return true;
}
