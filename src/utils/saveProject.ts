export function saveProjectToFile(project: any) {
  const json = JSON.stringify(project, null, 2);

  const defaultName = `projekt-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.json`;

  // ✅ okno zapisu (nazwa + lokalizacja)
  if ("showSaveFilePicker" in window) {
    (async () => {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: [
            {
              description: "Plik projektu",
              accept: { "application/json": [".json"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
      } catch (err) {
        console.error("Zapis anulowany:", err);
      }
    })();
    return;
  }

  // fallback (jak przeglądarka nie wspiera)
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();

  URL.revokeObjectURL(url);
}