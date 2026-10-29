export type Point = { x: number; y: number };

export const rideMotion = (frame: number, fps: number) => {
  const seconds = frame / fps;
  // Fifteen crank turns and thirty wheel turns make the 15-second loop close.
  const phase = seconds * Math.PI * 2;
  return {
    phase,
    wheelAngle: seconds * 720,
    distance: seconds * 4 * Math.PI * 130,
    bob: Math.sin(phase * 2) * 3,
    scarf: Math.sin(phase * 2),
    blink: Math.max(0, 1 - Math.abs(((seconds + 1.8) % 4) - 2) / 0.09),
  };
};

export const pedalPosition = (phase: number): Point => ({
  x: 950 + Math.cos(phase) * 48,
  y: 735 + Math.sin(phase) * 48,
});

// Two-link inverse kinematics keeps the foot on its pedal through every frame.
export const kneePosition = (hip: Point, foot: Point): Point => {
  const upper = 140;
  const lower = 148;
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  const distance = Math.hypot(dx, dy);
  const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance);
  const perpendicular = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
  return {
    x: hip.x + (along * dx + perpendicular * dy) / distance,
    y: hip.y + (along * dy - perpendicular * dx) / distance,
  };
};
