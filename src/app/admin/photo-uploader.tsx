"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Uploads the chosen photos one at a time (each request stays under the 10 MB proxy limit). */
export function PhotoUploader({ id }: { id: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0, bad = 0;
    for (const [i, file] of [...files].entries()) {
      setMsg(`Yükleniyor ${i + 1}/${files.length}…`);
      const fd = new FormData();
      fd.set("id", id);
      fd.set("file", file);
      const res = await fetch("/admin/upload", { method: "POST", body: fd }).catch(() => null);
      if (res?.ok) ok++; else bad++;
    }
    setBusy(false);
    setMsg(`${ok} fotoğraf eklendi${bad ? `, ${bad} dosya yüklenemedi (en fazla 10 MB, JPG/PNG/WebP/HEIC)` : ""}.`);
    if (input.current) input.current.value = "";
    router.refresh();
  }
  return (
    <div className="mt-3">
      <label className="btn-quiet inline-flex cursor-pointer !py-2 text-sm">
        {busy ? "Yükleniyor…" : "Fotoğraf ekle"}
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
      </label>
      {msg && <p role="status" className="mt-2 text-sm text-ink-soft">{msg}</p>}
    </div>
  );
}
