# iOS Strategy

## Objective
Replicate the core product experience as a native-quality iOS application after validating the web product.

## Current constraint
Development is currently done without a Mac. The existing webapp should therefore remain the primary development environment during validation.

## iOS priorities
1. Fast expense entry.
2. Excellent visual experience.
3. Shortcuts integration.
4. Widgets.
5. Smooth animations.
6. Reliable offline/poor-connectivity behavior where appropriate.

## Shortcuts hypothesis
The future iOS app should expose a Shortcut/action that allows a user to quickly create or confirm a transaction from an automation.

Potential flow:
card/Apple Pay usage or user automation → Shortcut → prefilled transaction → confirmation → saved transaction.

Technical feasibility and the exact trigger available in iOS must be validated before committing to a specific implementation.

## Architecture principle
The backend and core data model should remain platform-agnostic so the future iOS client can use the same user data and business model.

## App Store
Apple Developer Program cost is accepted as a required project cost when the app is ready for distribution.

No paid third-party financial APIs should be introduced solely to support the first iOS version unless the product has demonstrated revenue or strong user demand.
