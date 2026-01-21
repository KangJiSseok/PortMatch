package com.portmatch.infra.saramin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class SaraminCollector {

    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository companyRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 5시간마다 실행 (테스트할 때는 시간을 짧게 조절하거나 따로 호출해봐!)
    @Scheduled(cron = "0 0 0/5 * * *")
    @Transactional
    public void collect() throws Exception {
        log.info("사람인 데이터 수집 시작...");

        String accessKey = "네_사람인_API_키"; // 실제 키로 변경!
        String apiUrl = "https://oapi.saramin.co.kr/job-search/?access-key=" + accessKey + "&count=50&job_category=4";

        // 1. API 호출
        String response = restTemplate.getForObject(apiUrl, String.class);
        JsonNode root = objectMapper.readTree(response);
        JsonNode jobs = root.path("jobs").path("job");

        for (JsonNode job : jobs) {
            try {
                processJob(job);
            } catch (Exception e) {
                log.error("공고 처리 중 에러 발생 (ID: {}): {}", job.path("id").asText(), e.getMessage());
            }
        }
        log.info("사람인 데이터 수집 완료!");
    }

    private void processJob(JsonNode job) throws IOException {
        String wid = job.path("id").asText();

        if (jobPostingRepository.existsById(wid)) return;

        String href = job.path("company").path("detail").path("href").asText();
        String cid = extractCid(href);

        // 1. 기업(Company) 엔티티를 먼저 준비하자
        Company company = null;
        if (cid != null) {
            // 이미 DB에 있는 기업인지 확인
            company = companyRepository.findByCid(cid).orElse(null);

            // DB에 없으면 새로 저장하고 그 객체를 가져옴
            if (company == null) {
                company = saveCompany(cid); // saveCompany가 Company 객체를 반환하도록 수정할 거야!
            }
        }

        String detailUrl = "https://www.saramin.co.kr/zf_user/jobs/relay/view-detail?rec_idx=" + wid;
        Document doc = Jsoup.connect(detailUrl).userAgent("Mozilla/5.0").get();
        String detailHtml = doc.getElementsByClass("user_content").html();

        // 2. 빌더에서 .cid(cid) 대신 .company(company)로 넣어주기!
        JobPostingEntity posting = JobPostingEntity.builder()
                .id(wid)
                .title(job.path("position").path("title").asText())
                .active(job.path("active").asInt())
                .startDate(job.path("opening-timestamp").asText())
                .endDate(job.path("expiration-timestamp").asText())
                .company(company)
                .detail(detailHtml)
                .vcnt(0)
                .jobType(job.path("position").path("job-type").path("code").asInt())
                .build();

        jobPostingRepository.save(posting);
    }

    private Company saveCompany(String cid) throws IOException {
        String url = "https://www.saramin.co.kr/zf_user/company-info/view?csn=" + cid;
        Document doc = Jsoup.connect(url).userAgent("Mozilla/5.0").get();

        // 기업 정보가 없으면 null 반환
        if (!doc.getElementsByClass("result_txt").isEmpty()) return null;

        Elements infoCompany = doc.getElementsByClass("info_company");
        String corpNm = infoCompany.get(0).getElementsByClass("name").text();

        Company company = new Company(
                cid,
                corpNm,
                doc.getElementsByClass("txt_address").text(),
                null,
                infoCompany.get(0).getElementsByAttribute("href").attr("href"),
                null, null, null,
                extractLogo(doc)
        );

        return companyRepository.save(company);
    }

    private String extractCid(String href) {
        if (href.contains("csn=")) {
            return href.split("csn=")[1].split("&")[0];
        }
        return null;
    }

    private String extractLogo(Document doc) {
        Elements thumb = doc.getElementsByClass("thumb_company");
        if (!thumb.isEmpty() && thumb.get(0).getElementsByTag("img").attr("src").length() > 4) {
            return "https:" + thumb.get(0).getElementsByTag("img").attr("src").substring(4);
        }
        return null;
    }
}
