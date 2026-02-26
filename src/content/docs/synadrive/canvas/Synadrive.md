---
title: "Synadrive"
description: "Auto-generated from Obsidian canvas — visual overview of Synadrive."
---

:::note
This page is auto-generated from an Obsidian canvas file. Edit the source `.canvas` in Obsidian to update this page.
:::

## Synadrive Docs

- **# How Synadrive's Docs Hosting Will Work** — ```mermaid graph LR subgraph LocalMachine [Your Local Machine] O[Obsidian Vault] -->|Edit /Synadrive/| O O -->|Git Push| VR[Vault Repo] end subgraph GitHub [GitHub Actions Pipeline] VR -->|Push Trigger| GA[GitHub Action] GA -->|Filter: Path = Synadrive/| SYNC{Isolate & Copy} SYNC -->|Commit| WR[Website Repo] end subgraph Hosting [Live Website] WR -->|Auto Deploy| WEB[Synadrive Live Site] end ``` # How Github Actions Will Work ```mermaid sequenceDiagram participant VR as Vault Repo (Private) participant GA as GitHub Runner (Ubuntu) participant WR as Website Repo (Public) VR->>GA: Push event detected in /Synadrive/ GA->>GA: Checkout Vault Repo GA->>GA: Mask API Secrets (Security) GA->>GA: Filter files (Keep only /Synadrive) GA->>WR: Clone Website Repo to Temp Folder GA->>WR: Copy new .md files to /content GA->>WR: Git Commit & Push Note over WR: Website Repo triggers its own Build (Astro/Hugo) ```
- **# I have set up the entire Synadrive folder as a website!**

## Feature Dependencies

| From | Relationship | To |
|---|---|---|
| Gamedev/Synadrive/What Is Synadrive.md | → | # How Synadrive's Docs Hosting Will Work |

