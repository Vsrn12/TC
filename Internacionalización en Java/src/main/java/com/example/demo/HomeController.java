package com.example.demo;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class HomeController {

    @ModelAttribute("currentDate")
    String currentDate(Locale locale) {
        String pattern = "es".equals(locale.getLanguage()) ? "dd/MM/yyyy" : "MM/dd/yyyy";
        return LocalDate.now().format(DateTimeFormatter.ofPattern(pattern, locale));
    }

    @GetMapping("/")
    String home() {
        return "home";
    }

    @PostMapping("/")
    String submitQuestionnaire() {
        return "home";
    }
}

