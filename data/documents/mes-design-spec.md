# MES Software Design Specification

## 1. Overview

This document specifies the design of a Manufacturing Execution System (MES) for a discrete manufacturing plant producing automotive components. The MES bridges the gap between the enterprise ERP system and the shop-floor control layer in accordance with the ISA-95 reference model.

## 2. Architecture Layers

The system follows the ISA-95 hierarchy:

- **Level 4 (Enterprise):** ERP system handling order management, billing, and supply chain.
- **Level 3 (MES):** This system — manages production execution, scheduling dispatch, traceability, and quality.
- **Level 2 (Supervisory):** SCADA for line monitoring and recipe management.
- **Level 1 (Control):** PLCs controlling individual machines and cells.
- **Level 0 (Field):** Sensors and actuators on the physical equipment.

## 3. Core Modules

### 3.1 Production Order Management
The MES receives production orders from the ERP via a REST integration layer. Each order is decomposed into work orders routed to the appropriate work cells based on capacity and routing rules.

### 3.2 Equipment Connectivity
Equipment data is collected through OPC-UA servers deployed on each machine. An edge gateway aggregates OPC-UA tags, normalizes them into the ISA-95 B2MML data model, and forwards them to the plant data historian.

### 3.3 Quality Management
In-process measurements are captured at each workstation. Statistical Process Control (SPC) rules are evaluated in real time; out-of-control conditions trigger a hold on the affected work order and notify the quality engineer.

## 4. Data Model

The production data model is based on ISA-95 Part 2 objects: ProductionSchedule, ProductionRequest, ProductionResponse, EquipmentCapability, and PersonnelCapability. Each object is persisted in the PostgreSQL operational database.

## 5. Technology Stack

- **Backend:** Node.js microservices communicating over a message bus (RabbitMQ).
- **Database:** PostgreSQL for transactional data, TimescaleDB for time-series historian.
- **Realtime:** WebSocket gateway for SCADA HMI dashboards.
- **Deployment:** Containerized via Docker, orchestrated on Kubernetes at the plant edge cluster.
