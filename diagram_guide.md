# Grid Energy Management System using AI - Workflow Diagrams

This document contains various workflow diagrams that visualize the structure and flow of the Grid Energy Management System.

## Interactive HTML Diagram

For an interactive, detailed visualization, open the `workflow_diagram.html` file in a web browser. This HTML-based diagram includes:
- System Architecture Overview
- Detailed Workflow Diagram
- System Architecture Layers
- Data Flow Diagram

## Mermaid Flowchart Diagram

The file `mermaid_workflow.md` contains a Mermaid flowchart diagram that shows the high-level component interaction between:
- Frontend React components
- Backend Flask services
- AI models
- Data flow between components

## Sequence Diagram

The file `sequence_diagram.md` shows the time-based interaction between:
- User
- Frontend
- Backend
- AI Models
- Grid Failure Handler

This diagram is particularly useful for understanding how data flows through the system in chronological order.

## Class Diagram

The file `class_diagram.md` provides a structural view of the main data classes and their relationships:
- PowerSource
- MCB
- State
- Result
- PowerManagement
- Frontend
- Backend
- AIModels

## How to View These Diagrams

1. **HTML Diagram**: Open `workflow_diagram.html` in any web browser
2. **Mermaid Diagrams**: There are several options:
   - Use a Markdown previewer that supports Mermaid (like VS Code with Markdown Preview Enhanced)
   - Use the Mermaid Live Editor at https://mermaid.live/
   - Copy the Mermaid code into any Mermaid-compatible renderer

These diagrams complement each other to provide a comprehensive view of the system from different perspectives - structural, behavioral, and temporal.
