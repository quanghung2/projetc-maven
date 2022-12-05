package hungtq.maven.component.country.api;

import hungtq.maven.component.country.domain.Country;
import hungtq.maven.component.country.domain.CountryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController("getCountry")
@RequestMapping(path = "/api/v1/private/country")
public class Get {
    @Autowired
    CountryRepo countryRepo;

    @GetMapping(path = "/{countryId}")
    public Optional<Country> getCountry(@PathVariable Long countryId) {
        return countryRepo.findById(countryId);
    }
}
