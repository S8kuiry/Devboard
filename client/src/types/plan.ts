export interface Step {
  id?: number
  planId?: number
  content: string
  isCompleted: boolean
  position: number
}

export interface Plan {
  id?: number
  title: string
  ownerEmail: string
  createdAt?: string
  updatedAt?: string
  steps: Step[]
}