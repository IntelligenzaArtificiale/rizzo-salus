/*
 * Blog. Endpoint PHP attesi:
 * POST /blog/pubblici {}            → BlogPost[] (solo pubblicati)
 * POST /blog/articolo { slug }      → BlogPost   errori: non_trovato
 * POST /blog/elenco {}              → BlogPost[] (tutti, per l'admin)
 * POST /blog/dettaglio { id }       → BlogPost
 * POST /blog/salva { id?, dati }    → BlogPost   errori: slug_esistente
 * POST /blog/elimina { id }         → {}
 */
import { apiPost } from "@/api/client";
import type { BlogPost } from "@/api/mock/data/blog.data";

export type { BlogPost } from "@/api/mock/data/blog.data";
export type BlogInput = Omit<BlogPost, "id" | "data" | "autore">;

export const listPublicPosts = () => apiPost<BlogPost[]>("/blog/pubblici", {});
export const getPostBySlug = (slug: string) => apiPost<BlogPost>("/blog/articolo", { slug });
export const listPosts = () => apiPost<BlogPost[]>("/blog/elenco", {});
export const getPost = (id: string) => apiPost<BlogPost>("/blog/dettaglio", { id });
export const savePost = (dati: BlogInput, id?: string) => apiPost<BlogPost>("/blog/salva", { id, dati });
export const deletePost = (id: string) => apiPost<object>("/blog/elimina", { id });
