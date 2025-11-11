# Columns Layout Understanding

This document establishes the shared understanding for how columns are defined, displayed, and managed across all layouts in the Bible study application.

## Layout Modes

We have 4 distinct layout modes:
1. **Landscape**
2. **Portrait** 
3. **Mobile Landscape**
4. **Mobile Portrait**

## Portrait Mode
- **Structure:**
  - # Column (reference / index)
  - Followed by 2 columns that divide the remaining space equally.
- **Horizontal shifting in portrait** = shifting 1 column over.

## Landscape Mode
- **Centered when:**
  ```
  number_of_columns × column_width < viewport_width
  ```
- **Left aligned when:**
  ```
  number_of_columns × column_width ≥ viewport_width
  ```

## Translation Selector
- Found in the main menu.
- Allows the user to choose:
  - **Main translation** (always exactly 1, never 0).
  - **Alternate translations** (any others chosen besides the main).
- The main translation is not hard-coded (e.g., not always KJV). It always reflects the active choice from the menu.

## Column Definitions

| Column ID | Column Name | Description | Default State |
|-----------|-------------|-------------|---------------|
| 0 | **# Column** | Reference / index column showing every verse | Always active |
| 1 | **Notes Column** | User's personal notes per verse (members only) | Hidden |
| 2 | **Main Translation Column** | Always active, shows the single translation chosen as "main" | Always active |
| 3–15 | **Alternate Translation Columns** | Display additional translations besides the main | Hidden |
| 16 | **Cross Reference Column** | Displays cross references (already has working loader) | Hidden |
| 17–19 | **Prophecy Columns** | Prediction, Fulfillment, Verification | Hidden |
| 20 | **Master Column** | Fits into the column track but behaves more like an overlay. Stays aligned with the reader. Has its own scrollbar if needed. Always syncs with its proper slot while remaining semi-independent. | Hidden |

## Column Track System

### Core Idea
- Each column has a fixed **Column ID** (0–20).
- The **track** is an ordered list of slots. Each slot contains a column currently active.
- **Notation:** `slot/colId`
- **Example:** `0/0  1/2  2/16` →
  - Slot 0: Reference (colId=0)
  - Slot 1: Main Translation (colId=2)  
  - Slot 2: Cross References (colId=16)

### Automatic Ordering
- Each column has a default `orderKey` that defines its intended relative order.
- **When toggled ON:**
  - The column is inserted into the track according to its `orderKey`.
  - **Example:** `[0,2,16]` → toggling ON 3 results in `[0,2,3,16]` (`0/0  1/2  2/3  3/16`).
- **When toggled OFF:**
  - The column is simply removed.
  - **Exception:** Main Translation (2) cannot be removed.

### Manual Reordering
- Users can drag & drop active columns to reorder them.
- This is the only way to break out of the pre-structured order.
- When dragged, the column is spliced into the chosen slot, shifting others over.
- **Example:** `[0,2,3,16]` (shown as `0/0 1/2 2/3 3/16`) → dragging 16 to the first slot yields `[0,16,2,3]` → `0/0 1/16 2/2 3/3`.

### Invariants
1. **Main translation (2) is always active.**
2. **Track is authoritative.** UI should derive from track state only.
3. **Slot indices are contiguous** (0..N-1).
4. **No duplicates** of the same column in the track.

## Summary
- The **track system** defines the authoritative left-to-right order of all active columns.
- **Toggle ON/OFF** uses the pre-defined order system.
- **Manual reordering** allows user freedom, shifting slots accordingly.
- The **master column (20)** behaves as an overlay but still respects its slot alignment.