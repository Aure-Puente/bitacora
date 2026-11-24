// Lógica pura de las tareas previas.

// Primero las pendientes, después las hechas; dentro de cada grupo, por orden de creación.
export function sortTasks(tasks, createdMs) {
  return tasks
    .slice()
    .sort(
      (a, b) =>
        Number(!!a.done) - Number(!!b.done) ||
        createdMs(a) - createdMs(b) ||
        String(a.id).localeCompare(String(b.id))
    );
}

export function taskSummary(tasks, uid) {
  const pending = tasks.filter((t) => !t.done);
  return {
    total: tasks.length,
    done: tasks.length - pending.length,
    pending: pending.length,
    mine: pending.filter((t) => t.assigneeId === uid).length,
  };
}
