 # TechFix Troubleshooting Agent

An autonomous AI-powered troubleshooting agent built with:
- Node.js
- Express
- Hugging Face OpenAI-compatible API
- Safe tool execution with explicit permission

## Features
- Step-by-step troubleshooting plans
- Controlled diagnostic tool execution
- Secure Hugging Face API integration

## Setup
```bash

## Problem Solved
Users often struggle to diagnose technical issues safely. This project provides
an autonomous AI agent that analyzes problems, creates a step-by-step plan,
and requests permission before executing diagnostic actions.

## Architecture
- Express.js backend
- Hugging Face OpenAI-compatible API
- Tool execution sandbox with strict allow-list
- JSON-only agent planning system

## Safety Design
- No destructive commands allowed
- Explicit user permission required before execution
- Read-only diagnostics only

## API Example

POST /api/plan
```json
{
  "message": "My WiFi is not working"
}

