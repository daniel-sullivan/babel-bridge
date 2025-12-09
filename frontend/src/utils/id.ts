// Utility function for generating UUIDs that are safe for DOM element IDs
export function generateId(): string {
  let id: string;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const r = array[0] % 16;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } else {
    // Fallback: Math.random (not cryptographically secure)
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Ensure the ID starts with a letter for DOM compatibility
  if (!/^[a-zA-Z]/.test(id)) {
    id = 'id-' + id;
  }

  return id;
}

