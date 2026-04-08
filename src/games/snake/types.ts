export type Vec = { x: number; y: number }

export type SnakePowerUpType = 'speed' | 'slow' | 'ghost'

export type SnakePowerUp = {
  type: SnakePowerUpType
  pos: Vec
  expiresAt: number
}

