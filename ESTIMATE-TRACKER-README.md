# Estimate Tracker - Setup Guide

## Overview
The Estimate Tracker is a web-based system for tracking estimates and quotes for firm price contract jobs. It allows multiple estimators to collaborate by managing estimates, uploading documents, and tracking the status of each estimate from draft to completion.

## Features

### Core Functionality
- **Estimate Management**: Create, edit, and delete estimates with full project details
- **Document Management**: Upload and organize estimate documents (PDFs, spreadsheets, images)
- **Status Tracking**: Track estimate lifecycle (Draft → Sent → Approved/Rejected → Won/Lost)
- **Search & Filter**: Find estimates by project name, client, or estimator
- **Real-time Collaboration**: Multiple estimators can work simultaneously
- **Export**: Download complete estimate packages with all documents
- **Reporting**: Generate comprehensive reports with statistics and breakdowns

### Estimate Information Tracked
- Project Name
- Client Name
- Estimator (who created it)
- Estimated Value (dollar amount)
- Status (draft, sent, approved, rejected, won, lost)
- Date Created
- Date Sent to Client
- Notes/Comments
- Uploaded Documents

## Setup Instructions

### Step 1: Database Setup

1. Log in to your Supabase dashboard at https://supabase.com
2. Select your project (shncudhuqspawrvbdrza.supabase.co)
3. Navigate to the SQL Editor
4. Copy the contents of `estimate-tracker-schema.sql`
5. Paste into the SQL Editor and click "Run"
6. Verify that the tables were created successfully:
   - `estimates`
   - `estimate_documents`

### Step 2: Deploy the Application

**Option A: Simple File Hosting**
1. Upload `estimate-tracker.html` to your web server
2. Access via your domain (e.g., https://yourdomain.com/estimate-tracker.html)

**Option B: Local Testing**
1. Open `estimate-tracker.html` directly in your web browser
2. The application will work immediately (no server required)

**Option C: Same Server as Indoc Tracker**
1. Upload to the same location as your indoc tracker
2. Both applications share the same Supabase backend
3. Access via https://yourdomain.com/estimate-tracker.html

## Usage Guide

### Adding a New Estimate
1. Click the **"+ Add Estimate"** button
2. Fill in the required fields:
   - Project Name (required)
   - Client (required)
   - Estimator - your name (required)
   - Estimated Value (optional)
   - Status (defaults to "Draft")
   - Notes (optional)
3. Click **"Add Estimate"**

### Managing Documents
1. Click the **"Documents"** button on any estimate card
2. Click **"Choose File"** to select a document
3. Click **"Upload"** and enter your name
4. Documents are stored securely in the database
5. Download or delete documents as needed

### Updating Estimate Status
1. Click the **"Edit"** button on the estimate card
2. Update the status as the estimate progresses:
   - **Draft**: Initial creation, not yet sent
   - **Sent**: Estimate sent to client (set the "Date Sent")
   - **Approved**: Client approved the estimate
   - **Rejected**: Client rejected the estimate
   - **Won**: Job was awarded to you
   - **Lost**: Job was awarded to someone else
3. Update other fields as needed
4. Click **"Save Changes"**

### Searching and Filtering
- **Search Box**: Type to search by project name, client, or estimator
- **Status Filter**: Select a specific status to view only those estimates
- Combine search and filter for precise results

### Exporting Estimates
1. Click the **"Export"** button on any estimate card
2. A ZIP file will download containing:
   - `estimate-info.txt` - All estimate details
   - `documents/` folder - All uploaded documents
3. Share this package with clients or for record-keeping

### Generating Reports
1. Click the **"View Report"** button at the top
2. See summary statistics:
   - Total estimates by status
   - Total estimated value
   - Total won value
3. View detailed breakdowns by status
4. Click **"Copy to Clipboard"** to paste into emails or documents

## Statistics Dashboard

The top of the page shows real-time statistics:
- **Total**: All estimates in the system
- **Draft**: Not yet sent to clients
- **Sent**: Awaiting client response
- **Approved**: Client gave initial approval
- **Rejected**: Client declined
- **Won**: Jobs you secured
- **Lost**: Jobs that went elsewhere
- **Won Value**: Total dollar value of won jobs

## Best Practices

### For Estimators
1. Create estimates as "Draft" while working on them
2. Change to "Sent" when you deliver to the client (set Date Sent)
3. Update to "Approved/Rejected" based on client feedback
4. Mark as "Won" when you get the job (celebrate!)
5. Upload all related documents (quotes, drawings, correspondence)
6. Add notes about special requirements or client conversations

### For Collaboration
1. Use consistent client names (avoid "ABC Co" and "ABC Company")
2. Enter your full name as estimator for accountability
3. Upload documents promptly so others can reference them
4. Update status immediately when things change
5. Use notes field to communicate with other estimators

### Document Management
1. Use descriptive filenames (e.g., "ABC_Quote_Rev2.pdf")
2. Upload final versions, not drafts
3. Include client correspondence when relevant
4. Keep drawings and specifications together

## Technical Details

### Technology Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database)
- **Storage**: Base64-encoded documents in database
- **Deployment**: Static file (no server-side code required)

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (fully responsive)

### Security
- All data stored in Supabase with encryption
- Row Level Security (RLS) enabled
- No authentication required (trusted network access)
- Document data is base64 encoded

### Performance
- Optimized for up to 1,000 estimates
- Client-side filtering and search
- Efficient document handling
- Responsive on mobile devices

## Troubleshooting

### "Loading estimates..." never finishes
- Check internet connection
- Verify Supabase database tables exist
- Check browser console for errors (F12)

### Documents won't upload
- File may be too large (try files under 10MB)
- Check browser compatibility
- Ensure you entered your name when prompted

### Search not working
- Clear the search box and try again
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check that estimates exist in the database

### Export downloads empty ZIP
- Verify documents were uploaded successfully
- Try a different browser
- Check browser download settings

## Future Enhancements (Possible)
- User authentication and permissions
- Email notifications when status changes
- Integration with project tracking system
- Advanced reporting and analytics
- Document version control
- Client portal for viewing estimates
- Mobile app version

## Support
For issues or questions, contact your system administrator or the development team.

## Database Schema Reference

### estimates table
- `id`: Unique identifier
- `project_name`: Name of the project
- `client`: Client company/contact
- `estimator`: Person who created the estimate
- `date_created`: When estimate was created
- `date_sent`: When sent to client
- `estimated_value`: Dollar amount
- `status`: Current status
- `notes`: Additional comments
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

### estimate_documents table
- `id`: Unique identifier
- `estimate_id`: Links to estimates table
- `name`: Filename
- `type`: MIME type
- `data`: Base64 encoded file data
- `uploaded_by`: Person who uploaded
- `uploaded_at`: Upload timestamp
