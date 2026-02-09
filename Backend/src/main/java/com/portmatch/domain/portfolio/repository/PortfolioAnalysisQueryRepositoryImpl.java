package com.portmatch.domain.portfolio.repository;

import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.QPortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.QPortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.QPortfolioAnalysisProjectTech;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PortfolioAnalysisQueryRepositoryImpl implements PortfolioAnalysisQueryRepository {

    private final JPAQueryFactory queryFactory;
    private final QPortfolioAnalysis analysis = QPortfolioAnalysis.portfolioAnalysis;
    private final QPortfolioAnalysisProject project = QPortfolioAnalysisProject.portfolioAnalysisProject;
    private final QPortfolioAnalysisProjectTech tech = QPortfolioAnalysisProjectTech.portfolioAnalysisProjectTech;

    public PortfolioAnalysisQueryRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public Optional<PortfolioAnalysis> findWithProjectsByPortfolioId(Long portfolioId) {
        PortfolioAnalysis result = queryFactory
                .selectFrom(analysis)
                .leftJoin(analysis.projects, project).fetchJoin()
                .where(analysis.portfolio.id.eq(portfolioId))
                .distinct()
                .fetchOne();

        if (result == null) {
            return Optional.empty();
        }

        if (!result.getProjects().isEmpty()) {
            List<Long> projectIds = result.getProjects().stream()
                    .map(PortfolioAnalysisProject::getId)
                    .toList();

            queryFactory
                    .selectFrom(project)
                    .leftJoin(project.techs, tech).fetchJoin()
                    .where(project.id.in(projectIds))
                    .distinct()
                    .fetch();
        }

        return Optional.of(result);
    }
}
