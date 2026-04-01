export type Role = 'author' | 'viewer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  body: string
  image_url: string | null
  summary: string | null
  author_id: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  author?: User
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  comment_text: string
  is_hidden: boolean
  created_at: string
  user?: User
}