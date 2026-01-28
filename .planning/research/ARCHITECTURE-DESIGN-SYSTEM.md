# Architecture Patterns - Design System Component Library

**Domain:** Next.js 15 App Router PWA with Design System
**Researched:** 2026-01-28
**Overall confidence:** HIGH

---

## Executive Summary

Design system component libraries in Next.js 15 App Router require a **server-first, client-islands architecture** with strict layer separation. The recommended architecture uses **Atomic Design methodology** (Atoms → Molecules → Organisms → Templates) combined with **shadcn/ui's open code philosophy** where components are owned source code, not npm dependencies.

**Key architectural principles for 2026:**

1. **Server-First with Client Islands** - Components default to Server Components; mark client-only where necessary (`'use client'`)
2. **Flat-File Open Code** - Copy components into codebase rather than installing black-box dependencies
3. **Layered Composition** - Four-tier hierarchy (Atoms → Molecules → Organisms → Templates) with clear dependency flow
4. **Design Token Foundation** - Tailwind v4's `@theme` directive centralizes all design decisions in CSS variables
5. **Testing at Every Layer** - Vitest + React Testing Library with browser-native testing mode

This architecture scales from 20-30 components to enterprise-grade systems while maintaining consistency and developer experience.

---

## Recommended Component Organization

Based on Atomic Design methodology adapted for Next.js 15 App Router, organized by abstraction level.

**Confidence:** HIGH (Industry standard - Brad Frost Atomic Design + 2026 Next.js patterns)

**Sources:**
- [Atomic Design Methodology by Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/)
- [Next.js 15 App Router Architecture](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router)
- [shadcn/ui Architecture](https://ui.shadcn.com/docs)

---

**Architecture complete. File written to `.planning/research/ARCHITECTURE-DESIGN-SYSTEM.md`**
