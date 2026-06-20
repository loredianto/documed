package it.projectwork.documed.patientservice.dto;

import java.time.LocalDate;

/**
 * Daily admission and discharge counters used by the dashboard chart.
 */
public class DailyAdmissionStatisticsResponse {

    private final LocalDate date;
    private final long admissions;
    private final long discharges;

    public DailyAdmissionStatisticsResponse(LocalDate date, long admissions, long discharges) {
        this.date = date;
        this.admissions = admissions;
        this.discharges = discharges;
    }

    public LocalDate getDate() {
        return date;
    }

    public long getAdmissions() {
        return admissions;
    }

    public long getDischarges() {
        return discharges;
    }
}
