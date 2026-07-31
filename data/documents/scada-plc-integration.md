# SCADA & PLC Integration Architecture

## 1. Scope

This document describes the software architecture for integrating SCADA supervision with PLC-based machine control across a continuous-process chemical plant.

## 2. PLC Layer

Each process unit (reactor, distillation column, heat exchanger) is controlled by a redundant pair of PLCs running on a hot-standby configuration. PLCs communicate with the supervisory layer over an industrial Ethernet network using the Profinet protocol.

## 3. OPC-UA Gateway

An OPC-UA gateway server exposes a unified information model aggregating tags from all PLCs. The gateway implements the OPC-UA Companion Specification for instrumentation, mapping raw register data into semantically meaningful objects (e.g., TemperatureSensor, FlowController).

The MES and SCADA clients subscribe to OPC-UA monitored items to receive real-time updates with a target latency below 500 ms.

## 4. SCADA Functions

The SCADA layer provides:
- Real-time process visualization (HMI screens per unit).
- Alarm and event management with priority routing to operator consoles.
- Historical trending via a process historian.
- Batch execution per ISA-88 batch control standard, managing recipes, unit procedures, and operations.

## 5. Security

The control network is air-gapped from the corporate network. A unidirectional data diode permits telemetry to flow from the plant historian to higher-level analytics systems while preventing inbound traffic. All OPC-UA traffic is authenticated with X.509 certificates and encrypted with TLS 1.3.
