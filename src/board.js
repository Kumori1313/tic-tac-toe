// The database owns the rules. This module presents confirmed snapshots only.
export function mountBoard(container, onMove) {
  const cells = Array.from({ length: 9 }, (_, cell) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-cell';
    button.dataset.cell = cell;
    button.addEventListener('click', () => onMove(cell));
    container.append(button);
    return button;
  });
  return ({ room, userId, busy, online }) => {
    const match = room?.match;
    container.hidden = !match;
    if (!match) return;
    const mark = room.members.find(member => member.user_id === userId)?.mark;
    const canMove = room.status === 'playing' && match.status === 'playing'
      && mark === match.current_turn && !busy && online;
    container.dataset.revision = match.revision;
    container.setAttribute('aria-busy', String(busy));
    for (const [cell, button] of cells.entries()) {
      const value = match.board[cell];
      const winning = match.winning_line?.includes(cell) ?? false;
      button.textContent = value ?? '';
      button.dataset.mark = value ?? '';
      button.classList.toggle('winning-cell', winning);
      button.setAttribute('aria-label', `Row ${Math.floor(cell / 3) + 1}, column ${cell % 3 + 1}: ${value ?? 'empty'}${winning ? ', winning cell' : ''}`);
      button.disabled = !canMove || value !== null;
    }
  };
}
