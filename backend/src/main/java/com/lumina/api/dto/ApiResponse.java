package com.lumina.api.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import java.time.Instant;

@Builder @JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String message, ApiError error, Instant timestamp) {
    public static <T> ApiResponse<T> success(T data){ return ApiResponse.<T>builder().success(true).data(data).timestamp(Instant.now()).build(); }
    public static <T> ApiResponse<T> success(T data,String msg){ return ApiResponse.<T>builder().success(true).data(data).message(msg).timestamp(Instant.now()).build(); }
    public static <T> ApiResponse<T> error(String code,String msg){ return ApiResponse.<T>builder().success(false).error(new ApiError(code,msg,null)).timestamp(Instant.now()).build(); }
    public record ApiError(String code, String message, Object details){}
}
