# LV Job Builder V2 - Synergy Rebuild

A clean static Vercel package.

## Core architecture
- Calendar matrix is the job engine.
- Daily / Weekly use LV workstream rows and Mon-Sun columns.
- Monthly uses Jan-Dec project sequencing.
- Quarterly uses strategic planning rows and Q1-Q4.
- Bidder / Client / Job are global lenses.
- Job means total operational truth.
- Cells carry ownership: Bidder green, Client brown, Property purple, Unassigned gray.
- Right rail shows selected cell, labor, PM, risk, marked cells, unresolved cells, and summary.
- Selected Cell Tuner writes directly into the calendar cell.

## Vercel
Framework Preset: Other  
Install Command: `echo "Skipping install"`  
Build Command: `echo "Using prebuilt dist"`  
Output Directory: `dist`
