"""Pydantic input argument schemas for AI tools.

Every tool parameter processed by the AI model is validated against these schemas.
Numeric ranges are strictly bounded using `ge` and `le` to prevent the model from
requesting massive, memory-draining datasets.
"""

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class _Args(BaseModel):
    """Refuse any field a tool does not declare (D28). Ignoring it would be worse: a
    model that sends `member_id=<someone else>` would get the caller's own rows back
    and could present them as the other person's."""
    model_config = ConfigDict(extra="forbid")


# --- Admin Tool Argument Schemas ---

class SearchMembersArgs(_Args):
    query: str = Field(..., min_length=1, max_length=120,
                       description="Name or phone number fragment to search")
    limit: int = Field(default=10, ge=1, le=50, description="Max number of members to return")


class GetMemberDetailArgs(_Args):
    member_id: str = Field(..., description="Specific member row ID within this gym")


class ListExpiringMembershipsArgs(_Args):
    within_days: int = Field(default=7, ge=1, le=90, description="Number of days to look ahead for expiring memberships")
    limit: int = Field(default=25, ge=1, le=100, description="Max memberships to list; the total is always reported")


class ListInactiveMembersArgs(_Args):
    days_since_last_checkin: int = Field(default=21, ge=1, le=365, description="Days of continuous absence to classify as inactive")
    limit: int = Field(default=25, ge=1, le=100, description="Max members to list; the total is always reported")


class GetRevenueArgs(_Args):
    period: Literal["month", "last_month", "year", "all_time"] = Field(default="month", description="Time window: this calendar month, last calendar month, this year, or all time")
    group_by: Optional[Literal["month", "plan"]] = Field(default=None, description="Grouping level: 'month' for trends, 'plan' for breakdown by plan price")


class GetAttendanceStatsArgs(_Args):
    period: Literal["week", "month", "last_month", "year"] = Field(default="month", description="Time window: this week, this month, last calendar month, or this year")
    group_by: Literal["hour", "weekday", "month"] = Field(default="hour", description="Derived time interval to group check-ins by")


class ListRecentFeedbackArgs(_Args):
    limit: int = Field(default=20, ge=1, le=50, description="Max feedback items to return")
    sentiment: Optional[Literal["POSITIVE", "NEGATIVE", "NEUTRAL"]] = Field(default=None, description="Filter by feedback sentiment rating")


# --- Member Tool Argument Schemas ---

class GetMyPaymentsArgs(_Args):
    limit: int = Field(default=10, ge=1, le=50, description="Max payment records to return")


class GetMyAttendanceArgs(_Args):
    period: Literal["week", "month", "last_month", "year"] = Field(default="month", description="Time window: this week, this month, last calendar month, or this year")