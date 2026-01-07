# Calendar Integration Options for fotolokashen

**Date**: December 24, 2024  
**Question**: Google/Apple Calendar vs Custom Calendar System

---

## 🎯 TL;DR - Best Approach

**Recommendation**: **Option 2** - Universal "Add to Calendar" Links

**Why**: 
- ✅ Works with Google, Apple, Outlook, and all calendars
- ✅ No API keys or OAuth needed
- ✅ Implement in 1 hour
- ✅ Users choose their own calendar app
- ✅ Zero maintenance

---

## 📊 Three Options Comparison

| Feature               | Universal Links | Google Calendar API | Custom Calendar |
|---------              |---------------- |-------------------  |----------------|
| **Complexity**        | ⭐ Easy         | ⭐⭐⭐ Complex       | ⭐⭐⭐⭐ Very Complex |
| **Time to Implement** | 1 hour          | 4-6 hours          | 20+ hours       |
| **Works With**        | All calendars   | Google only        | Your app only   |
| **User Auth**         | None needed     | OAuth required     | Account required |
| **Maintenance**       | Zero            | Medium             | High            |
| **Cost**              | FREE            | FREE               | FREE (but dev time) |
| **Best For** | Most users | Google users | Full control |

---

## ✅ **RECOMMENDED: Option 1 - Universal Calendar Links**

### **How It Works**

Generate special links that work with **all calendar apps**:
- Google Calendar
- Apple Calendar
- Outlook
- Yahoo Calendar
- Any iCal-compatible app

### **User Experience**

```
User clicks "Add to Calendar" →
  Dropdown appears:
    [Google Calendar]
    [Apple Calendar]
    [Outlook]
    [Download .ics file]
  
User selects their preferred calendar →
  Event opens in their calendar app →
  User clicks "Save"
```

### **Implementation** (1 Hour)

**1. Install Package** (2 min)
```bash
npm install add-to-calendar-button
```

**2. Create Calendar Service** (20 min)
```typescript
// src/lib/calendar.ts

interface CalendarEvent {
    name: string;
    description?: string;
    startDate: string; // ISO format: "2024-12-25"
    startTime: string; // "09:00"
    endTime: string;   // "17:00"
    location?: string;
    options?: string[]; // ['Google', 'Apple', 'Outlook', 'iCal']
}

export function generateCalendarEvent(
    location: Location,
    date: Date,
    type: 'scout' | 'shoot'
): CalendarEvent {
    const title = type === 'scout' 
        ? `Scout Visit: ${location.name}`
        : `Shoot: ${location.name}`;

    const description = [
        `Location: ${location.name}`,
        `Address: ${location.address}`,
        `Type: ${location.type}`,
        location.productionNotes ? `Notes: ${location.productionNotes}` : '',
        `Map: ${process.env.NEXT_PUBLIC_APP_URL}/map?lat=${location.lat}&lng=${location.lng}`,
    ].filter(Boolean).join('\n');

    return {
        name: title,
        description,
        startDate: date.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        location: location.address,
        options: ['Google', 'Apple', 'Outlook', 'iCal']
    };
}
```

**3. Create React Component** (20 min)
```typescript
// src/components/calendar/AddToCalendar.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from 'lucide-react';

interface AddToCalendarProps {
    event: {
        title: string;
        description: string;
        location: string;
        startDate: string; // YYYY-MM-DD
        startTime: string; // HH:MM
        endTime: string;
    };
}

export function AddToCalendar({ event }: AddToCalendarProps) {
    const generateGoogleCalendarUrl = () => {
        const start = `${event.startDate.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`;
        const end = `${event.startDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`;
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            details: event.description,
            location: event.location,
            dates: `${start}/${end}`,
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const generateICSFile = () => {
        const start = `${event.startDate}T${event.startTime}:00`;
        const end = `${event.startDate}T${event.endTime}:00`;

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${start.replace(/[-:]/g, '')}`,
            `DTEND:${end.replace(/[-:]/g, '')}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\n');

        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/\s/g, '_')}.ics`;
        link.click();
    };

    const generateOutlookUrl = () => {
        const start = `${event.startDate}T${event.startTime}:00`;
        const end = `${event.startDate}T${event.endTime}:00`;

        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: event.title,
            body: event.description,
            location: event.location,
            startdt: start,
            enddt: end,
        });

        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    };

    const generateYahooUrl = () => {
        const start = `${event.startDate.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`;
        const end = `${event.startDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`;

        const params = new URLSearchParams({
            v: '60',
            title: event.title,
            desc: event.description,
            in_loc: event.location,
            st: start,
            et: end,
        });

        return `https://calendar.yahoo.com/?${params.toString()}`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Calendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => window.open(generateGoogleCalendarUrl(), '_blank')}>
                    📅 Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generateICSFile}>
                    🍎 Apple Calendar (.ics)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(generateOutlookUrl(), '_blank')}>
                    📧 Outlook Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(generateYahooUrl(), '_blank')}>
                    📮 Yahoo Calendar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

**4. Add to Your UI** (10 min)
```typescript
// In your LocationCard, InfoWindow, or Location details page
import { AddToCalendar } from '@/components/calendar/AddToCalendar';

<AddToCalendar
    event={{
        title: `Scout Visit: ${location.name}`,
        description: `Location: ${location.name}\nAddress: ${location.address}`,
        location: location.address,
        startDate: '2024-12-25',
        startTime: '09:00',
        endTime: '17:00',
    }}
/>
```

**5. Add Date Picker** (10 min) - Optional
```typescript
// Let users choose the date
import { DatePicker } from '@/components/ui/date-picker';

const [scoutDate, setScoutDate] = useState<Date>(new Date());

<DatePicker 
    selected={scoutDate}
    onChange={setScoutDate}
/>

<AddToCalendar
    event={{
        // ... other props
        startDate: scoutDate.toISOString().split('T')[0],
    }}
/>
```

### **Result** ✅

Users can add scout visits and shoots to **any calendar app** they use!

### **Pros**
- ✅ Works with ALL calendar apps
- ✅ No API keys needed
- ✅ No OAuth flow
- ✅ No user authentication required
- ✅ Quick to implement (1 hour)
- ✅ Zero maintenance
- ✅ Users stay in their preferred calendar

### **Cons**
- ❌ Can't auto-create events (user must click)
- ❌ Can't read users' calendars
- ❌ Can't show availability
- ❌ No two-way sync

### **Perfect For**
- ✅ Solo users and small teams
- ✅ Simple scheduling needs
- ✅ Users with different calendar preferences
- ✅ MVP and quick launch

---

## 🔵 **Option 2: Google Calendar API**

### **How It Works**

Deep integration with Google Calendar using their API.

### **Capabilities**
- ✅ Auto-create events on user's calendar
- ✅ Read user's availability
- ✅ Show free/busy times
- ✅ Update events automatically
- ✅ Delete events
- ✅ Send calendar invitations to team

### **Implementation** (4-6 Hours)

**1. Setup Google Cloud Project** (30 min)
- Enable Google Calendar API
- Create OAuth 2.0 credentials
- Configure consent screen

**2. Install Dependencies** (5 min)
```bash
npm install @google-cloud/calendar googleapis
```

**3. OAuth Flow** (2 hours)
```typescript
// src/app/api/auth/google/calendar/route.ts
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
    });

    return Response.redirect(url);
}
```

**4. Create Calendar Events** (2 hours)
```typescript
// src/lib/google-calendar.ts
import { google } from 'googleapis';

export async function createCalendarEvent(
    userAccessToken: string,
    location: Location,
    date: Date,
    attendees: string[]
) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `Scout Visit: ${location.name}`,
        location: location.address,
        description: `
            Location: ${location.name}
            Type: ${location.type}
            Production Notes: ${location.productionNotes || 'None'}
            
            View in app: ${process.env.NEXT_PUBLIC_APP_URL}/map?lat=${location.lat}&lng=${location.lng}
        `,
        start: {
            dateTime: date.toISOString(),
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
            timeZone: 'America/New_York',
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 30 },       // 30 min before
            ],
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send invitations to attendees
    });

    return response.data;
}
```

**5. Check Availability** (1 hour)
```typescript
export async function checkAvailability(
    userAccessToken: string,
    startDate: Date,
    endDate: Date
) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: [{ id: 'primary' }],
        },
    });

    return response.data.calendars?.primary?.busy || [];
}
```

### **Pros**
- ✅ Auto-create events (no user clicking)
- ✅ Check team availability
- ✅ Two-way sync
- ✅ Send calendar invitations
- ✅ Update/delete events programmatically
- ✅ Calendar reminders

### **Cons**
- ❌ Google Calendar users only
- ❌ Complex OAuth flow
- ❌ Need to manage tokens
- ❌ More code to maintain
- ❌ Privacy concerns (accessing calendars)

### **Perfect For**
- Teams heavily using Google Workspace
- Need to check availability
- Auto-scheduling features
- Calendar-based workflows

---

## 🍎 **Option 3: Apple Calendar (CalDAV)**

### **How It Works**

Use CalDAV protocol to sync with Apple Calendar (iCloud).

### **Implementation** (Similar to Google)

**More Complex**:
- CalDAV is older protocol
- Requires app-specific passwords
- Less documentation
- More maintenance

**Recommendation**: If you want deep integration, **use Google Calendar API** instead. More users, better docs, easier to implement.

---

## 🗓️ **Option 4: Custom Calendar System**

### **Build Your Own Calendar**

Create an in-app calendar for managing scout visits and shoots.

### **What You'd Build**

```
Calendar View:
  - Monthly/Weekly/Daily views
  - Location scout events
  - Shoot schedules
  - Team availability
  - Drag-and-drop scheduling
```

### **Implementation** (20+ Hours)

**Use a Calendar Library**:

**Option A: FullCalendar** (Most popular)
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

**Option B: React Big Calendar**
```bash
npm install react-big-calendar
```

**Option C: React Calendar** (Simpler)
```bash
npm install react-calendar
```

### **Example with FullCalendar**

```typescript
// src/components/calendar/ProductionCalendar.tsx
'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location: Location;
    type: 'scout' | 'shoot';
}

export function ProductionCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const handleEventClick = (info) => {
        // Show event details
        console.log('Event clicked:', info.event);
    };

    const handleDateClick = (arg) => {
        // Create new event
        console.log('Date clicked:', arg.date);
    };

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            editable={true}
            selectable={true}
        />
    );
}
```

### **Database Schema**

```typescript
// Prisma schema addition
model CalendarEvent {
  id          Int      @id @default(autoincrement())
  userId      Int
  locationId  Int?
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  type        String   // 'scout', 'shoot', 'meeting'
  attendees   String[] // Array of user IDs or emails
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id])
  location Location? @relation(fields: [locationId], references: [id])
}
```

### **API Endpoints**

```typescript
// src/app/api/calendar/events/route.ts
export async function GET(request: Request) {
    // Get user's calendar events
    const events = await prisma.calendarEvent.findMany({
        where: { userId: user.id },
        include: { location: true }
    });
    return Response.json(events);
}

export async function POST(request: Request) {
    // Create new calendar event
    const { title, startTime, endTime, locationId } = await request.json();
    
    const event = await prisma.calendarEvent.create({
        data: {
            userId: user.id,
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            locationId,
        }
    });
    
    return Response.json(event);
}
```

### **Pros**
- ✅ Full control over features
- ✅ Custom to your needs
- ✅ Beautiful in-app experience
- ✅ No external dependencies
- ✅ Team calendar integration
- ✅ Production-specific features

### **Cons**
- ❌ Lots of development time (20+ hours)
- ❌ More code to maintain
- ❌ Doesn't sync with external calendars
- ❌ Users must check your app
- ❌ Mobile apps needed for push notifications

### **Perfect For**
- Full production management platform
- Complex scheduling needs
- Want complete control
- Long-term investment

---

## 🎯 **My Recommendation**

### **Start with Option 1** (Universal Links)

**Why**:
1. ✅ **Quick**: Implement in 1 hour
2. ✅ **Universal**: Works with all calendars
3. ✅ **Simple**: No OAuth, no API keys
4. ✅ **User-friendly**: Users choose their calendar
5. ✅ **Zero cost**: FREE, no maintenance

**Implementation Order**:

### **Week 1**: Universal Calendar Links (1 hour)
```typescript
<AddToCalendar event={{
    title: `Scout: ${location.name}`,
    location: location.address,
    startDate: '2024-12-25',
    startTime: '09:00',
    endTime: '17:00',
}} />
```

### **Month 2** (Optional): Add Google Calendar API (6 hours)
Only if you need:
- Auto-create events
- Check team availability
- Calendar invitations

### **Month 6** (Optional): Custom Calendar (20+ hours)
Only if you're building full production management platform.

---

## 💡 **Hybrid Approach** (Best of Both Worlds)

**Combine Options 1 + 4**:

1. **Universal Links** for individual users (works with any calendar)
2. **Custom Calendar View** in your app to see team's schedule

```typescript
// Users get both:
[Add to My Calendar] ← Universal link (Google/Apple/Outlook)
[View Team Calendar] ← In-app FullCalendar showing everyone's events
```

**Benefits**:
- ✅ Users can sync to their personal calendars
- ✅ Team can see shared production calendar
- ✅ Best of both worlds!

---

## 📋 **Quick Implementation: Universal Calendar**

Want to add this **today**? Here's the 30-minute version:

1. **Create AddToCalendar component** (15 min)
2. **Add to LocationCard** (5 min)
3. **Add to InfoWindow** (5 min)  
4. **Test with different calendars** (5 min)

**Result**: Users can add scout visits to any calendar app! ✅

---

## 🚀 **Next Steps**

**Ready to implement?** I can help you:

1. Build the universal calendar component (Option 1)
2. Set up Google Calendar API (Option 2)
3. Create custom calendar system (Option 4)
4. Hybrid approach (1 + 4)

**My strong recommendation**: Start with **Option 1** (Universal Links) - it's quick, effective, and works for everyone!

Want me to build it now? 📅
