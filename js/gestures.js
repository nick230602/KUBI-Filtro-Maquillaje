// Histéresis + permanencia + pausa: un gesto sostenido produce un solo evento.
export class GestureGate {
  constructor(name, enter, exit, hold = 110, cooldown = 900) {
    Object.assign(this, { name, enter, exit, hold, cooldown });
    this.lastFire = -Infinity;
    this.reset();
  }
  reset() { this.active = false; this.since = null; this.releaseSince = null; }
  update(value, now) {
    if (this.active) {
      if (value < this.exit) {
        this.releaseSince ??= now;
        if (now - this.releaseSince >= 100) this.reset();
      } else this.releaseSince = null;
      return false;
    }
    if (value <= this.enter) { this.since = null; return false; }
    this.since ??= now;
    if (now - this.since < this.hold || now - this.lastFire < this.cooldown) return false;
    this.active = true;
    this.lastFire = now;
    return true;
  }
}
