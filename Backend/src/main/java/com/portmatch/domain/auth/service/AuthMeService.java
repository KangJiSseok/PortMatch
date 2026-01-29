package com.portmatch.domain.auth.service;

import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.dto.response.MeResponse;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.companies.entity.Company;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthMeService {

    private final CompanyRepository companyRepository;
    private final AuthResponseMapper authResponseMapper;

    public MeResponse getMe(User user) {
        String cid = null;

        if (user.getRole() == Role.COMPANY) {
            cid = companyRepository.findByUserId(user.getId())
                    .map(Company::getCid)
                    .orElse(null);
            log.info("get cid");
        }

        return authResponseMapper.toMeResponse(user, cid);
    }

    public LoginResponse login(User user){
        return authResponseMapper.toLoginResponse(user);
    }
}
