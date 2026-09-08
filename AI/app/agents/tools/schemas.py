"""Pydantic input argument schemas for AI tools.

Every tool parameter processed by the AI model is validated against these schemas.
Numeric ranges are strictly bounded using `ge` and `le` to prevent the model from
requesting massive, memory-draining datasets.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


# --- Admin Tool Argument Schemas ---

class SearchMembersArgs(BaseModel):
    query: str = Field(..., min_length=1, max_length=120,
                       description="Name or phone number fragment to search")
    limit: int = Field(default=10, ge=1, le=50, description="Max number of members to return")


class GetMemberDetailArgs(BaseModel):
    member_id: str = Field(..., description="Specific member row ID within this gym")


class ListExpiringMembershipsArgs(BaseModel):
    within_days: int = Field(default=7, ge=1, le=90, description="Number of days to look ahead for expiring memberships")


class ListInactiveMembersArgs(BaseModel):
    days_since_last_checkin: int = Field(default=21, ge=1, le=365, description="Days of continuous absence to classify as inactive")
    limit: int = Field(default=25, ge=1, le=100, description="Max number of inactive members to return")


class GetRevenueArgs(BaseModel):
    period: Literal["month", "year", "all_time"] = Field(default="month", description="Time window for revenue aggregation")
    group_by: Optional[Literal["month", "plan"]] = Field(default=None, description="Grouping level: 'month' for trends, 'plan' for breakdown by plan price")


class GetAttendanceStatsArgs(BaseModel):
    period: Literal["week", "month", "year"] = Field(default="month", description="Time window for attendance stats")
    group_by: Literal["hour", "weekday", "month"] = Field(default="hour", description="Derived time interval to group check-ins by")


class ListRecentFeedbackArgs(BaseModel):
    limit: int = Field(default=20, ge=1, le=50, description="Max feedback items to return")
    sentiment: Optional[Literal["POSITIVE", "NEGATIVE", "NEUTRAL"]] = Field(default=None, description="Filter by feedback sentiment rating")


# --- Member Tool Argument Schemas ---

class GetMyPaymentsArgs(BaseModel):
    limit: int = Field(default=10, ge=1, le=50, description="Max payment records to return")


class GetMyAttendanceArgs(BaseModel):
    period: Literal["week", "month", "year"] = Field(default="month", description="Time window for personal attendance history")