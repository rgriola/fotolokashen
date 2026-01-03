# Slack Integration for Merkel Vision

**Date**: December 24, 2024  
**Status**: Planned - Ready to Implement  
**Priority**: High - Killer feature for production teams

---

## 🎯 Why Slack Integration?

Production teams **live in Slack**. This integration would be a **game-changer** for Merkel Vision.

### **Key Benefits**
- ✅ Meet production teams where they already work
- ✅ Faster team communication (no email threads)
- ✅ Better collaboration on location selection
- ✅ Competitive advantage (unique feature)
- ✅ Easy to implement (30 min for MVP)

---

## 📋 Top Use Cases

### **1. Share Locations** 📍
Post location cards to team channels with photos, details, and interactive buttons.

**Example**:
```
🎬 New Location: Empire State Building
Type: INTERVIEW
Address: 350 5th Ave, NYC
Rating: ⭐⭐⭐⭐☆
Parking: Street parking available
[View in App] [Get Directions]
```

### **2. Team Notifications** 🔔
Automatic updates when locations are added/modified:
- "New INTERVIEW location added: Empire State Building"
- "Photo added to Times Square location"
- "Friend shared 3 new BROLL locations with you"

### **3. Production Alerts** 🎬
Critical updates during production:
- Permit approvals
- Weather alerts for outdoor locations
- Location access changes
- Road closures near shoot locations

### **4. Scout Reports** 📊
Daily/weekly summaries posted automatically:
```
Daily Scout Report - Dec 24, 2024
📍 5 new locations added
🎬 3 STORY locations
📸 2 BROLL locations
⭐ Top rated: Brooklyn Bridge (4.5/5)
```

### **5. Collaboration** 💬
Discuss locations directly in Slack threads, keeping all feedback centralized.

---

## 🛠️ Implementation Options

| Option | Complexity | Time | Best For |
|--------|-----------|------|----------|
| **Incoming Webhooks** | ⭐ Easy | 30 min | Quick start, one-way sharing |
| **Slack Bolt Framework** | ⭐⭐ Medium | 2 hours | Full features, slash commands |
| **Full OAuth Integration** | ⭐⭐⭐ Advanced | 4+ hours | Enterprise, multi-workspace |

**Recommendation**: Start with **Incoming Webhooks**, upgrade to **Slack Bolt** when ready.

---

## ⚡ Quick Start: 30-Minute MVP

### **Goal**: Working "Share to Slack" button

### **Steps**:

**1. Create Slack Webhook** (10 min)
- Go to [api.slack.com/apps](https://api.slack.com/apps)
- Click "Create New App" → "From scratch"
- Name: "Merkel Vision"
- Choose your workspace
- Go to "Incoming Webhooks"
- Turn on "Activate Incoming Webhooks"
- Click "Add New Webhook to Workspace"
- Select channel (e.g., #locations)
- Copy webhook URL

**2. Add Environment Variable** (2 min)
```bash
# .env.local
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
```

**3. Create Share Function** (10 min)
```typescript
// src/lib/slack.ts
export async function shareLocationToSlack(location: Location) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
        throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `📍 New Location: ${location.name}`,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: `🎬 ${location.name}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Type:* ${location.type}\n*Address:* ${location.address}\n*Rating:* ${'⭐'.repeat(location.userSave?.personalRating || 0)}`
                    }
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: { type: "plain_text", text: "View in App" },
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/map?lat=${location.lat}&lng=${location.lng}`
                        },
                        {
                            type: "button",
                            text: { type: "plain_text", text: "Get Directions" },
                            url: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error('Failed to share to Slack');
    }

    return { success: true };
}
```

**4. Add API Endpoint** (5 min)
```typescript
// src/app/api/slack/share/route.ts
import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { shareLocationToSlack } from '@/lib/slack';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized) {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { locationId } = await request.json();

        // Get location with all details
        const location = await prisma.location.findUnique({
            where: { id: locationId },
            include: {
                userSaves: {
                    where: { userId: authResult.user!.id },
                    take: 1
                }
            }
        });

        if (!location) {
            return apiError('Location not found', 404, 'NOT_FOUND');
        }

        // Share to Slack
        await shareLocationToSlack({
            ...location,
            userSave: location.userSaves[0]
        });

        return apiResponse({ success: true, message: 'Shared to Slack!' });
    } catch (error: any) {
        console.error('Slack share error:', error);
        return apiError('Failed to share to Slack', 500, 'SLACK_ERROR');
    }
}
```

**5. Add Share Button to UI** (3 min)
```typescript
// Add to LocationCard.tsx or InfoWindow
import { useState } from 'react';

const [isSharing, setIsSharing] = useState(false);

const handleShareToSlack = async () => {
    setIsSharing(true);
    try {
        const response = await fetch('/api/slack/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationId: location.id })
        });

        if (response.ok) {
            alert('Shared to Slack! ✅');
        } else {
            alert('Failed to share to Slack');
        }
    } catch (error) {
        console.error('Share error:', error);
        alert('Failed to share to Slack');
    } finally {
        setIsSharing(false);
    }
};

// In your component JSX:
<Button 
    onClick={handleShareToSlack} 
    disabled={isSharing}
    variant="outline"
>
    {isSharing ? 'Sharing...' : 'Share to Slack'}
</Button>
```

**Result**: ✅ Working Slack integration in 30 minutes!

---

## 🎨 Phase 2: Rich Location Cards (2-3 hours)

### **Enhanced Message Format**

```typescript
export async function shareLocationToSlack(location: Location) {
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `🎬 ${location.name}`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Type:* ${location.type}\n*Address:* ${location.address}\n*Rating:* ${'⭐'.repeat(location.userSave?.personalRating || 0)}`
            },
            accessory: location.photos?.[0] ? {
                type: "image",
                image_url: location.photos[0].url,
                alt_text: location.name
            } : undefined
        },
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*Parking:*\n${location.parking || 'Not specified'}`
                },
                {
                    type: "mrkdwn",
                    text: `*Access:*\n${location.access || 'Not specified'}`
                },
                {
                    type: "mrkdwn",
                    text: `*Indoor/Outdoor:*\n${location.indoorOutdoor || 'Not specified'}`
                },
                {
                    type: "mrkdwn",
                    text: `*Permit Required:*\n${location.permitRequired ? 'Yes' : 'No'}`
                }
            ]
        }
    ];

    if (location.productionNotes) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Production Notes:*\n${location.productionNotes}`
            }
        });
    }

    blocks.push({
        type: "actions",
        elements: [
            {
                type: "button",
                text: { type: "plain_text", text: "View in App" },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/map?lat=${location.lat}&lng=${location.lng}`,
                style: "primary"
            },
            {
                type: "button",
                text: { type: "plain_text", text: "Get Directions" },
                url: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
            }
        ]
    });

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
    });
}
```

---

## 🔔 Phase 3: Auto-Notifications (3-4 hours)

### **Notify on Location Save**

```typescript
// In useSaveLocation hook or API endpoint
const mutation = useMutation({
    mutationFn: saveLocationAPI,
    onSuccess: async (data) => {
        // Existing success logic...
        
        // Auto-share to Slack if enabled
        if (user.settings?.autoShareToSlack) {
            await fetch('/api/slack/notify', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'location_saved',
                    location: data.location
                })
            });
        }
    }
});
```

### **Notification Types**

```typescript
// src/app/api/slack/notify/route.ts
export async function POST(request: NextRequest) {
    const { event, location, user } = await request.json();

    let message = '';
    
    switch (event) {
        case 'location_saved':
            message = `📍 ${user.firstName} added new ${location.type} location: *${location.name}*`;
            break;
        case 'photo_added':
            message = `📸 Photo added to *${location.name}*`;
            break;
        case 'location_updated':
            message = `✏️ ${user.firstName} updated *${location.name}*`;
            break;
        case 'friend_shared':
            message = `👥 ${user.firstName} shared a location with you: *${location.name}*`;
            break;
    }

    await sendSlackNotification(message, location);
}
```

---

## 💬 Phase 4: Slash Commands (4-6 hours)

### **Available Commands**

```bash
/location search <query>     # Search your saved locations
/location share <id>         # Share specific location by ID
/scout-report               # Get today's scouting summary
/location nearby            # Locations near your current position
/location stats             # Your scouting statistics
```

### **Implementation**

```typescript
// src/app/api/slack/commands/route.ts
export async function POST(request: Request) {
    const formData = await request.formData();
    const command = formData.get('command');
    const text = formData.get('text');
    const userId = formData.get('user_id');

    // Verify Slack signature here (security)

    if (command === '/location') {
        const [action, ...args] = text.split(' ');

        switch (action) {
            case 'search':
                const results = await searchLocations(args.join(' '));
                return formatLocationSearchResults(results);
            
            case 'share':
                const locationId = parseInt(args[0]);
                await shareLocationToSlack(locationId);
                return { text: 'Location shared! ✅' };
            
            case 'stats':
                const stats = await getUserLocationStats(userId);
                return formatStats(stats);
        }
    }
}
```

---

## 🔒 Security Best Practices

### **Environment Variables**
```bash
# Server-side only - NEVER expose to client
SLACK_BOT_TOKEN="xoxb-..."
SLACK_SIGNING_SECRET="..."
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

### **Verify Slack Signatures**
```typescript
import crypto from 'crypto';

function verifySlackSignature(request: Request) {
    const timestamp = request.headers.get('X-Slack-Request-Timestamp');
    const signature = request.headers.get('X-Slack-Signature');
    const body = await request.text();

    const baseString = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
        .update(baseString)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(mySignature)
    );
}
```

### **User Permissions**
- ✅ Only share to channels user has access to
- ✅ Don't auto-share without user consent
- ✅ Allow users to disconnect Slack anytime
- ✅ Respect team privacy settings

---

## 📁 File Structure

```
src/
├── lib/
│   └── slack.ts                      # Core Slack utilities
├── app/
│   └── api/
│       └── slack/
│           ├── share/route.ts        # Share location endpoint
│           ├── notify/route.ts       # Auto-notifications
│           ├── webhook/route.ts      # Incoming webhooks
│           └── commands/route.ts     # Slash commands
├── components/
│   └── slack/
│       ├── ShareToSlackButton.tsx    # Reusable share button
│       ├── SlackSettings.tsx         # User Slack preferences
│       └── SlackChannelSelector.tsx  # Channel selection modal
└── types/
    └── slack.ts                      # Slack-related types
```

---

## 🎯 Phased Roadmap

### **Week 1: MVP** (30 min - 2 hours)
- ✅ Set up Slack webhook
- ✅ Create share function
- ✅ Add share button to UI
- ✅ Test with one channel

### **Week 2: Enhanced Cards** (2-3 hours)
- ✅ Add location photos
- ✅ Include all production details
- ✅ Add interactive buttons
- ✅ Improve formatting

### **Week 3: Auto-Notifications** (3-4 hours)
- ✅ Auto-share on location save
- ✅ Photo upload notifications
- ✅ Friend share notifications
- ✅ User settings to enable/disable

### **Month 2: Full Integration** (6-8 hours)
- ✅ Slash commands
- ✅ OAuth for multi-workspace
- ✅ Interactive components
- ✅ Daily scout reports
- ✅ Team analytics

---

## 📊 Success Metrics

### **Track These**:
- Number of locations shared to Slack
- User adoption rate (% using Slack feature)
- Team engagement (Slack reactions, comments)
- Time saved vs email communication

### **Goal Metrics**:
- 50% of users connect Slack (Month 1)
- 100+ locations shared/week (Month 2)
- 5 min avg time saved per location share

---

## 🚀 Next Steps

**Ready to implement?**

1. **30-Minute MVP**: Get basic sharing working
2. **User Feedback**: Test with your team
3. **Iterate**: Add features based on usage
4. **Scale**: Add slash commands, automation

**Want help implementing any phase?** Just let me know!

---

## 📚 Resources

- **Slack API Docs**: [api.slack.com](https://api.slack.com)
- **Block Kit Builder**: [app.slack.com/block-kit-builder](https://app.slack.com/block-kit-builder)
- **Bolt Framework**: [slack.dev/bolt-js](https://slack.dev/bolt-js)
- **Incoming Webhooks Guide**: [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)

---

**Status**: Ready to implement  
**Priority**: High - Killer feature for production teams  
**Estimated ROI**: Very High - Teams will love this! 🎯
