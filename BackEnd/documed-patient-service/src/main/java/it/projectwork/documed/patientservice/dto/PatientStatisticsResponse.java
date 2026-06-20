package it.projectwork.documed.patientservice.dto;

import java.util.List;

/**
 * Patient and admission counters required by the administrative dashboard.
 */
public class PatientStatisticsResponse {

    private final long totalPatients;
    private final long activeAdmissions;
    private final long admissionsToday;
    private final long dischargesToday;
    private final List<DailyAdmissionStatisticsResponse> lastSevenDays;

    public PatientStatisticsResponse(long totalPatients, long activeAdmissions,
            long admissionsToday, long dischargesToday,
            List<DailyAdmissionStatisticsResponse> lastSevenDays) {
        this.totalPatients = totalPatients;
        this.activeAdmissions = activeAdmissions;
        this.admissionsToday = admissionsToday;
        this.dischargesToday = dischargesToday;
        this.lastSevenDays = lastSevenDays;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public long getActiveAdmissions() {
        return activeAdmissions;
    }

    public long getAdmissionsToday() {
        return admissionsToday;
    }

    public long getDischargesToday() {
        return dischargesToday;
    }

    public List<DailyAdmissionStatisticsResponse> getLastSevenDays() {
        return lastSevenDays;
    }
}
