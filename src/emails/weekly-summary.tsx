import { Button, Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout, emailStyles } from "./base-layout";

interface PlatformStat {
  platform: string;
  views: number;
  likes: number;
  newFollowers: number;
}

interface WeeklySummaryEmailProps {
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  videosCreated?: number;
  topVideoTitle?: string;
  topVideoViews?: number;
  platformStats?: PlatformStat[];
  weekStart?: string;
  weekEnd?: string;
}

export function WeeklySummaryEmail({
  totalViews = 12500,
  totalLikes = 890,
  totalComments = 145,
  videosCreated = 5,
  topVideoTitle = "10 AI Tools for Creators",
  topVideoViews = 5200,
  platformStats = [
    { platform: "YouTube", views: 5000, likes: 400, newFollowers: 50 },
    { platform: "TikTok", views: 7000, likes: 450, newFollowers: 120 },
    { platform: "Instagram", views: 500, likes: 40, newFollowers: 10 },
  ],
  weekStart = "Mar 24",
  weekEnd = "Mar 30",
}: WeeklySummaryEmailProps) {
  return (
    <BaseLayout preview={`Weekly summary: ${totalViews.toLocaleString()} views, ${totalLikes.toLocaleString()} likes`}>
      <Text style={emailStyles.heading}>
        Weekly Summary
      </Text>
      <Text style={emailStyles.muted}>
        {weekStart} — {weekEnd}
      </Text>

      {/* Overview Stats */}
      <Section style={{ ...emailStyles.card, marginTop: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <tr>
            <td style={statCell}>
              <Text style={statNumber}>{totalViews.toLocaleString()}</Text>
              <Text style={statLabel}>Views</Text>
            </td>
            <td style={statCell}>
              <Text style={statNumber}>{totalLikes.toLocaleString()}</Text>
              <Text style={statLabel}>Likes</Text>
            </td>
            <td style={statCell}>
              <Text style={statNumber}>{totalComments.toLocaleString()}</Text>
              <Text style={statLabel}>Comments</Text>
            </td>
            <td style={statCell}>
              <Text style={statNumber}>{videosCreated}</Text>
              <Text style={statLabel}>Videos</Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Top Video */}
      {topVideoTitle && (
        <>
          <Text style={{ ...emailStyles.text, fontWeight: "600", color: "#ffffff", marginTop: "24px" }}>
            Top Video
          </Text>
          <Section style={emailStyles.card}>
            <Text style={{ ...emailStyles.text, fontWeight: "600", color: "#ffffff", margin: "0 0 4px" }}>
              {topVideoTitle}
            </Text>
            <Text style={{ ...emailStyles.muted, margin: "0" }}>
              {topVideoViews?.toLocaleString()} views
            </Text>
          </Section>
        </>
      )}

      {/* Platform Breakdown */}
      {platformStats.length > 0 && (
        <>
          <Text style={{ ...emailStyles.text, fontWeight: "600", color: "#ffffff", marginTop: "24px" }}>
            Platform Breakdown
          </Text>
          <Section style={emailStyles.card}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr>
                  <th style={thStyle}>Platform</th>
                  <th style={thStyle}>Views</th>
                  <th style={thStyle}>Likes</th>
                  <th style={thStyle}>Followers</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map((stat) => (
                  <tr key={stat.platform}>
                    <td style={tdStyle}>{stat.platform}</td>
                    <td style={tdStyle}>{stat.views.toLocaleString()}</td>
                    <td style={tdStyle}>{stat.likes.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: "#0d9960" }}>
                      +{stat.newFollowers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      <Hr style={{ borderColor: "#2a2a2a", margin: "24px 0" }} />

      <Section style={{ marginBottom: "24px" }}>
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/analytics`}
          style={emailStyles.button}
        >
          View Full Analytics
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        You can disable weekly summaries in your email preferences.
      </Text>
    </BaseLayout>
  );
}

const statCell = {
  textAlign: "center" as const,
  padding: "8px 4px",
};
const statNumber = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#ffffff",
  margin: "0",
};
const statLabel = {
  fontSize: "11px",
  color: "#888888",
  margin: "0",
  textTransform: "uppercase" as const,
};
const thStyle = {
  fontSize: "11px",
  color: "#888888",
  textTransform: "uppercase" as const,
  padding: "8px 4px",
  textAlign: "left" as const,
  borderBottom: "1px solid #333",
};
const tdStyle = {
  fontSize: "13px",
  color: "#cccccc",
  padding: "8px 4px",
  borderBottom: "1px solid #222",
};

export default WeeklySummaryEmail;
